#!/usr/bin/env bash
set -Eeuo pipefail

DEPLOY_ROOT="${DEPLOY_ROOT:-/opt/msktires}"
CURRENT_LINK="$DEPLOY_ROOT/current"
PREVIOUS_LINK="$DEPLOY_ROOT/previous"
FRONTEND_ENV_FILE="${FRONTEND_ENV_FILE:-/etc/msktires/frontend.env}"
BACKEND_SERVICE="${BACKEND_SERVICE:-msktires-backend.service}"
FRONTEND_SERVICE="${FRONTEND_SERVICE:-msktires-frontend.service}"

TARGET="${1:-}"
if [[ -z "$TARGET" ]]; then
  [[ -L "$PREVIOUS_LINK" ]] || { echo "No previous release is recorded" >&2; exit 1; }
  TARGET="$(readlink -f "$PREVIOUS_LINK")"
elif [[ "$TARGET" != /* ]]; then
  TARGET="$DEPLOY_ROOT/releases/$TARGET"
fi
TARGET="$(readlink -f "$TARGET")"

case "$TARGET" in
  "$DEPLOY_ROOT"/releases/*) ;;
  *) echo "Refusing target outside $DEPLOY_ROOT/releases: $TARGET" >&2; exit 1 ;;
esac

test -f "$TARGET/backend/server.js"
test -f "$TARGET/frontend/.next/BUILD_ID"

set -a
# shellcheck disable=SC1090
source "$FRONTEND_ENV_FILE"
set +a
: "${PUBLIC_URL:?Set PUBLIC_URL in $FRONTEND_ENV_FILE}"

OLD_CURRENT="$(readlink -f "$CURRENT_LINK")"
ROLLBACK_LINK="$DEPLOY_ROOT/.rollback-$(date -u +%Y%m%d%H%M%S)-$$"
ln -s "$TARGET" "$ROLLBACK_LINK"
mv -Tf "$ROLLBACK_LINK" "$CURRENT_LINK"
ln -sfn "$OLD_CURRENT" "$PREVIOUS_LINK"

restore_original() {
  local restore_link="$DEPLOY_ROOT/.restore-$(date -u +%Y%m%d%H%M%S)-$$"
  ln -s "$OLD_CURRENT" "$restore_link"
  mv -Tf "$restore_link" "$CURRENT_LINK"
  ln -sfn "$TARGET" "$PREVIOUS_LINK"
  systemctl restart "$BACKEND_SERVICE" "$FRONTEND_SERVICE" || true
}

if ! systemctl restart "$BACKEND_SERVICE" "$FRONTEND_SERVICE"; then
  restore_original
  echo "Rollback target did not start; original release restored" >&2
  exit 1
fi

if ! "$CURRENT_LINK/deploy/scripts/smoke-test.sh" "$PUBLIC_URL"; then
  restore_original
  echo "Rollback target failed checks; original release restored" >&2
  exit 1
fi

echo "Rollback activated: $TARGET"
