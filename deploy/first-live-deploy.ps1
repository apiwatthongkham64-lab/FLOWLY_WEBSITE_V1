$ErrorActionPreference = "Stop"
$EnvFile = if ($env:ENV_FILE) { $env:ENV_FILE } else { ".env.production" }
if (-not (Test-Path $EnvFile)) { throw "Missing $EnvFile. Generate it first from backend with prod:env:generate." }
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { throw "Docker is not installed or not on PATH." }
docker compose version | Out-Null

Write-Host "`n[1/7] Validate production environment"
Push-Location backend
node scripts/check-production-env.js
Pop-Location

Write-Host "`n[2/7] Validate Compose configuration"
docker compose --env-file $EnvFile config | Out-Null

Write-Host "`n[3/7] Build FLOWLY images"
docker compose --env-file $EnvFile build api web

Write-Host "`n[4/7] Start PostgreSQL and wait for health"
docker compose --env-file $EnvFile up -d db
$status = ""
for ($i=0; $i -lt 30; $i++) {
  $dbId = docker compose --env-file $EnvFile ps -q db
  if ($dbId) { $status = docker inspect --format='{{.State.Health.Status}}' $dbId 2>$null }
  if ($status -eq "healthy") { break }
  Start-Sleep -Seconds 2
}
if ($status -ne "healthy") { docker compose --env-file $EnvFile logs --tail=100 db; throw "PostgreSQL did not become healthy." }

Write-Host "`n[5/7] Apply database migrations"
docker compose --env-file $EnvFile run --rm api node scripts/migrate.js

Write-Host "`n[6/7] Start API and Web"
docker compose --env-file $EnvFile up -d api web

Write-Host "`n[7/7] Run smoke tests"
$env:ENV_FILE = $EnvFile
& "$PSScriptRoot/smoke-test.ps1"

Write-Host "`nFLOWLY V2.35 first-live deployment completed successfully."
docker compose --env-file $EnvFile ps
