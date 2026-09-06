$ErrorActionPreference = "Stop"
$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$envFile = if ($env:ENV_FILE) { $env:ENV_FILE } else { Join-Path $projectRoot ".env.production" }
if (-not (Test-Path $envFile)) { throw "Missing production env file: $envFile" }

$cfg = @{}
Get-Content $envFile | ForEach-Object {
  $line = $_.Trim()
  if ($line -and -not $line.StartsWith('#') -and $line.Contains('=')) {
    $k,$v = $line.Split('=',2); $cfg[$k] = $v
  }
}
$port = if ($cfg['WEB_PORT']) { $cfg['WEB_PORT'] } else { '8080' }
if (-not $env:SMOKE_BASE_URL) { $env:SMOKE_BASE_URL = "http://127.0.0.1:$port" }
if (-not $env:SMOKE_OWNER_PASSWORD -and $env:DEMO_PASSWORD) { $env:SMOKE_OWNER_PASSWORD = $env:DEMO_PASSWORD }

Write-Host "FLOWLY V2.36 Production Smoke Test"
Write-Host "Target: $env:SMOKE_BASE_URL"
if ($env:SMOKE_WRITE -eq 'true') { Write-Host "Mode: FULL (writes enabled)" }
else { Write-Host "Mode: SAFE (no workflow writes)" }

Push-Location (Join-Path $projectRoot "backend")
try { node scripts/production-e2e-smoke.js }
finally { Pop-Location }
