$ErrorActionPreference = "Stop"
if (-not (Test-Path ".env.production")) { throw "Missing .env.production. Copy .env.production.example to .env.production and set secrets first." }
docker compose --env-file .env.production up -d db
Start-Sleep -Seconds 2
docker compose --env-file .env.production run --rm api node scripts/migrate.js
docker compose --env-file .env.production up -d --build
docker compose ps
