[CmdletBinding()]
param(
  [ValidateRange(1024,65535)][int]$ApiPort = 4100,
  [ValidateRange(1024,65535)][int]$WebPort = 5273,
  [string]$Project = 'chromium'
)
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$evidence = Join-Path $root 'test-results\playwright'
if (-not (Test-Path -LiteralPath $evidence)) { throw "Playwright evidence directory is missing: $evidence" }
$apiJob = $null
$webJob = $null

Push-Location $root
try {
  $apiJob = Start-Job -ScriptBlock {
    param($WorkingRoot, $Port)
    Set-Location $WorkingRoot
    $env:API_PORT = $Port
    $env:API_HOST = '127.0.0.1'
    node --import tsx apps/api/src/server.ts
  } -ArgumentList $root,$ApiPort.ToString()
  $webJob = Start-Job -ScriptBlock {
    param($WorkingRoot, $Port)
    Set-Location $WorkingRoot
    node node_modules/vite/bin/vite.js --config apps/web/vite.config.js --configLoader runner --host 127.0.0.1 --port $Port
  } -ArgumentList $root,$WebPort.ToString()
  function Test-LocalPort([int]$Port) {
    $client = $null
    try {
      $client = [Net.Sockets.TcpClient]::new('127.0.0.1', $Port)
      return $client.Connected
    } catch { return $false }
    finally { if ($client) { $client.Dispose() } }
  }
  $ready = $false
  for ($attempt = 0; $attempt -lt 40; $attempt += 1) {
    if ((Test-LocalPort $ApiPort) -and (Test-LocalPort $WebPort)) { $ready = $true; break }
    Start-Sleep -Milliseconds 500
  }
  if (-not $ready) {
    Receive-Job -Job $apiJob,$webJob -Keep -ErrorAction SilentlyContinue | Write-Output
    throw 'Isolated E2E servers did not become ready; startup diagnostics were emitted above.'
  }
  $env:E2E_EXTERNAL_SERVER = 'true'
  $env:E2E_BASE_URL = "http://127.0.0.1:$WebPort"
  $env:E2E_API_BASE_URL = "http://127.0.0.1:$ApiPort"
  & npm.cmd run test:e2e -- --project=$Project
  if ($LASTEXITCODE -ne 0) { throw "Playwright failed with exit code $LASTEXITCODE." }
} finally {
  if ($apiJob) { Stop-Job -Job $apiJob -ErrorAction SilentlyContinue; Remove-Job -Job $apiJob -Force -ErrorAction SilentlyContinue }
  if ($webJob) { Stop-Job -Job $webJob -ErrorAction SilentlyContinue; Remove-Job -Job $webJob -Force -ErrorAction SilentlyContinue }
  Remove-Item Env:API_PORT,Env:API_HOST,Env:E2E_EXTERNAL_SERVER,Env:E2E_BASE_URL,Env:E2E_API_BASE_URL -ErrorAction SilentlyContinue
  Pop-Location
}
