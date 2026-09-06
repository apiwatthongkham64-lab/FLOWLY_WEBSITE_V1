#!/usr/bin/env sh
set -eu
ENV_FILE="${ENV_FILE:-.env.production}"
[ -f "$ENV_FILE" ] || { echo "ERROR: Missing $ENV_FILE"; exit 1; }
WEB_PORT="$(awk -F= '$1=="WEB_PORT"{print $2}' "$ENV_FILE" | tail -n1)"
WEB_PORT="${WEB_PORT:-8080}"
BASE="http://127.0.0.1:${WEB_PORT}"

check_url() {
  name="$1"; url="$2"; tries=0
  while [ "$tries" -lt 30 ]; do
    if curl -fsS --max-time 5 "$url" >/tmp/flowly_smoke_body 2>/dev/null; then
      echo "PASS - $name ($url)"; return 0
    fi
    tries=$((tries+1)); sleep 2
  done
  echo "FAIL - $name ($url)"; return 1
}

check_url "Web health" "$BASE/healthz"
check_url "API health through Nginx" "$BASE/api/v1/health"
check_url "Homepage" "$BASE/index.html"

echo "Smoke tests: 3/3 passed"
