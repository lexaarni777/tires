#!/usr/bin/env bash
set -Eeuo pipefail

PUBLIC_URL="${1:-${PUBLIC_URL:-}}"
if [[ -z "$PUBLIC_URL" ]]; then
  echo "Usage: PUBLIC_URL=https://example.com $0 [public-url]" >&2
  exit 2
fi

PUBLIC_URL="${PUBLIC_URL%/}"
ATTEMPTS="${SMOKE_ATTEMPTS:-20}"
DELAY_SECONDS="${SMOKE_DELAY_SECONDS:-2}"

request() {
  local url="$1"
  local output_file="$2"
  local attempt

  for ((attempt = 1; attempt <= ATTEMPTS; attempt += 1)); do
    if curl --fail --silent --show-error --location \
      --connect-timeout 3 --max-time 15 "$url" --output "$output_file"; then
      return 0
    fi
    if ((attempt < ATTEMPTS)); then
      sleep "$DELAY_SECONDS"
    fi
  done

  echo "Smoke check failed: $url" >&2
  return 1
}

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

request "$PUBLIC_URL/api/health" "$TMP_DIR/health.json"
grep -q '"status":"ok"' "$TMP_DIR/health.json"

request "$PUBLIC_URL/api/products/catalog?limit=1" "$TMP_DIR/catalog.json"
node -e 'JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"))' "$TMP_DIR/catalog.json"

request "$PUBLIC_URL/" "$TMP_DIR/home.html"
grep -Eqi '<html|<!doctype' "$TMP_DIR/home.html"

request "$PUBLIC_URL/productlist" "$TMP_DIR/catalog.html"
grep -Eqi '<html|<!doctype' "$TMP_DIR/catalog.html"

request "$PUBLIC_URL/robots.txt" "$TMP_DIR/robots.txt"
grep -q 'User-agent:' "$TMP_DIR/robots.txt"
grep -q "Sitemap: $PUBLIC_URL/sitemap.xml" "$TMP_DIR/robots.txt"

request "$PUBLIC_URL/sitemap.xml" "$TMP_DIR/sitemap.xml"
grep -q '<urlset' "$TMP_DIR/sitemap.xml"
grep -q "<loc>$PUBLIC_URL/</loc>" "$TMP_DIR/sitemap.xml"

if [[ -n "${SMOKE_PRODUCT_ARTICLE:-}" ]]; then
  ENCODED_ARTICLE="$(node -p 'encodeURIComponent(process.argv[1])' "$SMOKE_PRODUCT_ARTICLE")"
  request "$PUBLIC_URL/productdetailed/$ENCODED_ARTICLE" "$TMP_DIR/product.html"
  grep -Eqi '<html|<!doctype' "$TMP_DIR/product.html"
else
  echo "SMOKE_PRODUCT_ARTICLE is empty: product card check skipped" >&2
fi

if [[ -n "${SMOKE_UPLOAD_PATH:-}" ]]; then
  if [[ "$SMOKE_UPLOAD_PATH" != /uploads/* ]]; then
    echo "SMOKE_UPLOAD_PATH must start with /uploads/" >&2
    exit 2
  fi
  request "$PUBLIC_URL$SMOKE_UPLOAD_PATH" "$TMP_DIR/upload"
  test -s "$TMP_DIR/upload"
else
  echo "SMOKE_UPLOAD_PATH is empty: uploaded image check skipped" >&2
fi

echo "Smoke checks passed for $PUBLIC_URL"
