#!/usr/bin/env sh
set -eu
ENV_FILE="${ENV_FILE:-.env.production}"
[ -f "$ENV_FILE" ] || { echo "ERROR: Missing $ENV_FILE"; exit 1; }
docker compose --env-file "$ENV_FILE" ps
printf '\nAPI health:\n'
WEB_PORT="$(awk -F= '$1=="WEB_PORT"{print $2}' "$ENV_FILE" | tail -n1)"; WEB_PORT="${WEB_PORT:-8080}"
curl -fsS "http://127.0.0.1:${WEB_PORT}/api/v1/health" || true
printf '\n\nRecent API logs:\n'
docker compose --env-file "$ENV_FILE" logs --tail=50 api
