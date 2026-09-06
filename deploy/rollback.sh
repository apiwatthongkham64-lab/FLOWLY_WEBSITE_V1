#!/usr/bin/env sh
set -eu
ENV_FILE="${ENV_FILE:-.env.production}"
[ -f "$ENV_FILE" ] || { echo "ERROR: Missing $ENV_FILE"; exit 1; }
echo "Stopping FLOWLY application containers without deleting PostgreSQL volume..."
docker compose --env-file "$ENV_FILE" stop web api
echo "Database container and flowly_pgdata volume are left intact."
echo "To restart the current release: docker compose --env-file $ENV_FILE up -d api web"
