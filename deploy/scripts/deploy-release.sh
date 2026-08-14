#!/usr/bin/env bash
set -Eeuo pipefail

DEPLOY_ROOT="${DEPLOY_ROOT:-/opt/msktires}"
SOURCE_DIR="${SOURCE_DIR:-$(git rev-parse --show-toplevel)}"
REF="${1:-HEAD}"
FRONTEND_ENV_FILE="${FRONTEND_ENV_FILE:-/etc/msktires/frontend.env}"
BACKEND_ENV_FILE="${BACKEND_ENV_FILE:-/etc/msktires/backend.env}"
BACKEND_SERVICE="${BACKEND_SERVICE:-msktires-backend.service}"
FRONTEND_SERVICE="${FRONTEND_SERVICE:-msktires-frontend.service}"
SERVICE_USER="${SERVICE_USER:-msktires}"
SERVICE_GROUP="${SERVICE_GROUP:-msktires}"

for command_name in git node npm curl systemctl install; do
  command -v "$command_name" >/dev/null || {
    echo "Required command not found: $command_name" >&2
    exit 1
  }
done

[[ -r "$FRONTEND_ENV_FILE" ]] || { echo "Cannot read $FRONTEND_ENV_FILE" >&2; exit 1; }
[[ -r "$BACKEND_ENV_FILE" ]] || { echo "Cannot read $BACKEND_ENV_FILE" >&2; exit 1; }

set -a
# shellcheck disable=SC1090
source "$FRONTEND_ENV_FILE"
set +a

: "${NEXT_PUBLIC_API_URL:?Set NEXT_PUBLIC_API_URL in $FRONTEND_ENV_FILE}"
: "${NEXT_PUBLIC_SITE_URL:?Set NEXT_PUBLIC_SITE_URL in $FRONTEND_ENV_FILE}"
: "${PUBLIC_URL:?Set PUBLIC_URL in $FRONTEND_ENV_FILE}"

COMMIT="$(git -C "$SOURCE_DIR" rev-parse --verify "$REF^{commit}")"
SHORT_COMMIT="$(git -C "$SOURCE_DIR" rev-parse --short=12 "$COMMIT")"
RELEASE_ID="$(date -u +%Y%m%d%H%M%S)-$SHORT_COMMIT"
RELEASES_DIR="$DEPLOY_ROOT/releases"
RELEASE_DIR="$RELEASES_DIR/$RELEASE_ID"
CURRENT_LINK="$DEPLOY_ROOT/current"
PREVIOUS_LINK="$DEPLOY_ROOT/previous"
SHARED_UPLOADS="${SHARED_UPLOADS:-/var/lib/msktires/uploads}"

mkdir -p "$RELEASES_DIR"
install -d -o "$SERVICE_USER" -g "$SERVICE_GROUP" -m 0750 "$SHARED_UPLOADS"
mkdir "$RELEASE_DIR"

cleanup_incomplete_release() {
  if [[ ! -e "$CURRENT_LINK" || "$(readlink -f "$CURRENT_LINK")" != "$RELEASE_DIR" ]]; then
    echo "Incomplete release kept for diagnosis: $RELEASE_DIR" >&2
  fi
}
trap cleanup_incomplete_release ERR

git -C "$SOURCE_DIR" archive "$COMMIT" | tar -x -C "$RELEASE_DIR"
ln -s "$SHARED_UPLOADS" "$RELEASE_DIR/backend/uploads"

npm --prefix "$RELEASE_DIR/backend" ci --omit=dev
npm --prefix "$RELEASE_DIR/frontend" ci
npm --prefix "$RELEASE_DIR/frontend" run build

test -f "$RELEASE_DIR/frontend/.next/BUILD_ID"
test -f "$RELEASE_DIR/backend/server.js"

PREVIOUS_RELEASE=""
if [[ -L "$CURRENT_LINK" ]]; then
  PREVIOUS_RELEASE="$(readlink -f "$CURRENT_LINK")"
  ln -sfn "$PREVIOUS_RELEASE" "$PREVIOUS_LINK"
fi

NEXT_LINK="$DEPLOY_ROOT/.current-$RELEASE_ID-$$"
ln -s "$RELEASE_DIR" "$NEXT_LINK"
mv -Tf "$NEXT_LINK" "$CURRENT_LINK"

rollback_after_failure() {
  echo "New release failed smoke checks; restoring previous release" >&2
  if [[ -n "$PREVIOUS_RELEASE" ]]; then
    local rollback_link="$DEPLOY_ROOT/.rollback-$RELEASE_ID-$$"
    ln -s "$PREVIOUS_RELEASE" "$rollback_link"
    mv -Tf "$rollback_link" "$CURRENT_LINK"
    systemctl restart "$BACKEND_SERVICE" "$FRONTEND_SERVICE"
    if ! "$CURRENT_LINK/deploy/scripts/smoke-test.sh" "$PUBLIC_URL"; then
      echo "CRITICAL: previous release was restored but failed smoke checks" >&2
    fi
  else
    systemctl stop "$BACKEND_SERVICE" "$FRONTEND_SERVICE" || true
  fi
}

if ! systemctl restart "$BACKEND_SERVICE" "$FRONTEND_SERVICE"; then
  rollback_after_failure
  exit 1
fi

if ! "$CURRENT_LINK/deploy/scripts/smoke-test.sh" "$PUBLIC_URL"; then
  rollback_after_failure
  exit 1
fi

trap - ERR
echo "Release activated: $RELEASE_ID"
