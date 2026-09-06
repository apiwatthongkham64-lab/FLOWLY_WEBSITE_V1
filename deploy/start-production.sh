#!/usr/bin/env sh
set -eu
[ -f .env.production ] || { echo "Missing .env.production (copy from .env.production.example)"; exit 1; }
docker compose --env-file .env.production up -d db
sleep 2
docker compose --env-file .env.production run --rm api node scripts/migrate.js
docker compose --env-file .env.production up -d --build
printf '\nFLOWLY started. Check: docker compose ps\n'
