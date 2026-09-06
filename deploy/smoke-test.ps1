$ErrorActionPreference = "Stop"
$EnvFile = if ($env:ENV_FILE) { $env:ENV_FILE } else { ".env.production" }
if (-not (Test-Path $EnvFile)) { throw "Missing $EnvFile" }
$cfg = @{}
Get-Content $EnvFile | ForEach-Object {
  $line = $_.Trim()
  if ($line -and -not $line.StartsWith('#') -and $line.Contains('=')) {
    $k,$v = $line.Split('=',2); $cfg[$k] = $v
  }
}
$port = if ($cfg['WEB_PORT']) { $cfg['WEB_PORT'] } else { '8080' }
$base = "http://127.0.0.1:$port"
function Test-Endpoint($Name, $Url) {
  for ($i=0; $i -lt 30; $i++) {
    try { Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 5 | Out-Null; Write-Host "PASS - $Name ($Url)"; return }
    catch { Start-Sleep -Seconds 2 }
  }
  throw "FAIL - $Name ($Url)"
}
Test-Endpoint "Web health" "$base/healthz"
Test-Endpoint "API health through Nginx" "$base/api/v1/health"
Test-Endpoint "Homepage" "$base/index.html"
Write-Host "Smoke tests: 3/3 passed"
