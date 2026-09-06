#!/usr/bin/env sh
set -eu
ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT/.env.production}"
[ -f "$ENV_FILE" ] || { echo "ERROR: Missing $ENV_FILE"; exit 1; }
WEB_PORT="$(awk -F= '$1=="WEB_PORT"{print $2}' "$ENV_FILE" | tail -n1)"
WEB_PORT="${WEB_PORT:-8080}"
export SMOKE_BASE_URL="${SMOKE_BASE_URL:-http://127.0.0.1:$WEB_PORT}"
echo "FLOWLY V2.36 Production Smoke Test"
echo "Target: $SMOKE_BASE_URL"
if [ "${SMOKE_WRITE:-false}" = "true" ]; then echo "Mode: FULL (writes enabled)"; else echo "Mode: SAFE (no workflow writes)"; fi
cd "$ROOT/backend"
node scripts/production-e2e-smoke.js
