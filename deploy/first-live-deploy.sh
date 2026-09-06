#!/usr/bin/env sh
set -eu

ENV_FILE="${ENV_FILE:-.env.production}"
[ -f "$ENV_FILE" ] || { echo "ERROR: Missing $ENV_FILE"; echo "Generate it first with: cd backend && npm run prod:env:generate -- --domain=YOUR-DOMAIN.COM"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "ERROR: Docker is not installed or not on PATH"; exit 1; }
docker compose version >/dev/null 2>&1 || { echo "ERROR: Docker Compose v2 is required"; exit 1; }

printf '\n[1/7] Validate production environment\n'
(cd backend && node scripts/check-production-env.js)

printf '\n[2/7] Validate Compose configuration\n'
docker compose --env-file "$ENV_FILE" config >/dev/null

printf '\n[3/7] Build FLOWLY images\n'
docker compose --env-file "$ENV_FILE" build api web

printf '\n[4/7] Start PostgreSQL and wait for health\n'
docker compose --env-file "$ENV_FILE" up -d db
attempt=0
while [ "$attempt" -lt 30 ]; do
  status="$(docker inspect --format='{{.State.Health.Status}}' "$(docker compose --env-file "$ENV_FILE" ps -q db)" 2>/dev/null || true)"
  [ "$status" = "healthy" ] && break
  attempt=$((attempt+1)); sleep 2
done
[ "${status:-}" = "healthy" ] || { echo "ERROR: PostgreSQL did not become healthy"; docker compose --env-file "$ENV_FILE" logs --tail=100 db; exit 1; }

printf '\n[5/7] Apply database migrations\n'
docker compose --env-file "$ENV_FILE" run --rm api node scripts/migrate.js

printf '\n[6/7] Start API and Web\n'
docker compose --env-file "$ENV_FILE" up -d api web

printf '\n[7/7] Run smoke tests\n'
ENV_FILE="$ENV_FILE" sh deploy/smoke-test.sh

printf '\nFLOWLY V2.35 first-live deployment completed successfully.\n'
docker compose --env-file "$ENV_FILE" ps
