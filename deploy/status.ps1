$ErrorActionPreference = "Stop"
$EnvFile = if ($env:ENV_FILE) { $env:ENV_FILE } else { ".env.production" }
if (-not (Test-Path $EnvFile)) { throw "Missing $EnvFile" }
docker compose --env-file $EnvFile ps
$cfg=@{}; Get-Content $EnvFile | ForEach-Object { $l=$_.Trim(); if($l -and -not $l.StartsWith('#') -and $l.Contains('=')){ $k,$v=$l.Split('=',2); $cfg[$k]=$v } }
$port=if($cfg['WEB_PORT']){$cfg['WEB_PORT']}else{'8080'}
Write-Host "`nAPI health:"
try { Invoke-RestMethod -Uri "http://127.0.0.1:$port/api/v1/health" -TimeoutSec 5 | ConvertTo-Json -Depth 5 } catch { Write-Warning $_ }
Write-Host "`nRecent API logs:"
docker compose --env-file $EnvFile logs --tail=50 api
