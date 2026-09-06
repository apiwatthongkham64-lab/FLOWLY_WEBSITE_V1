$ErrorActionPreference = "Stop"
$EnvFile = if ($env:ENV_FILE) { $env:ENV_FILE } else { ".env.production" }
if (-not (Test-Path $EnvFile)) { throw "Missing $EnvFile" }
Write-Host "Stopping FLOWLY application containers without deleting PostgreSQL volume..."
docker compose --env-file $EnvFile stop web api
Write-Host "Database container and flowly_pgdata volume are left intact."
Write-Host "Restart with: docker compose --env-file $EnvFile up -d api web"
