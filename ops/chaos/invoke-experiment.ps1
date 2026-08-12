[CmdletBinding()]
param(
  [Parameter(Mandatory)][ValidateSet('worker-kill','cache-outage','cache-latency')][string]$Experiment,
  [Parameter(Mandatory)][string]$ConfirmToken,
  [ValidateRange(5,60)][int]$DurationSeconds = 15,
  [ValidateRange(0,2000)][int]$LatencyMilliseconds = 300,
  [switch]$Execute
)

$ErrorActionPreference = 'Stop'
if ($env:CHAOS_ENABLED -ne 'true') { throw 'Set CHAOS_ENABLED=true explicitly.' }
$allowlist = if ($env:CHAOS_ENVIRONMENT_ALLOWLIST) { $env:CHAOS_ENVIRONMENT_ALLOWLIST } else { 'local,demo,ci' }
$allowed = ($allowlist -split ',').Trim()
$current = if ($env:APP_ENV) { $env:APP_ENV } else { 'local' }
if ($current -notin $allowed) { throw "APP_ENV '$current' is not allowlisted." }
if ($ConfirmToken -ne 'FLOWLINE-LOCAL-CHAOS') { throw 'Confirmation token mismatch.' }
$configuredMax = if ($env:CHAOS_MAX_DURATION_SECONDS) { [int]$env:CHAOS_MAX_DURATION_SECONDS } else { 60 }
if ($DurationSeconds -gt $configuredMax) { throw "Duration exceeds configured maximum of $configuredMax seconds." }

$root = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path
if (-not $root.EndsWith([IO.Path]::DirectorySeparatorChar + 'flowline')) { throw "Refusing to run outside Flowline: $root" }
$plan = switch ($Experiment) {
  'worker-kill' { 'SIGKILL the local api service, wait at most the requested duration, then recreate it.' }
  'cache-outage' { 'Stop the local redis service, wait at most the requested duration, then restart it.' }
  'cache-latency' { "Add ${LatencyMilliseconds}ms bounded downstream latency to the redis Toxiproxy, then remove it." }
}
Write-Output "CHAOS_PLAN experiment=$Experiment environment=$current duration_seconds=$DurationSeconds action=$plan"
Write-Output 'ABORT incorrect_authoritative_value=true suspected_data_exposure=true error_rate_percent=5 database_saturation_percent=80 cleanup_failure=true'
if (-not $Execute) { Write-Output 'CHAOS_DRY_RUN_COMPLETE add -Execute to run the guarded local experiment'; return }

Push-Location $root
try {
  if (-not (Test-Path -LiteralPath './docker-compose.yml')) { throw 'Missing docker-compose.yml.' }
  $dockerEndpoint = (& docker context inspect --format '{{(index .Endpoints "docker").Host}}' 2>$null | Select-Object -First 1)
  if ($LASTEXITCODE -ne 0 -or -not $dockerEndpoint) { throw 'Cannot prove the active Docker endpoint is local.' }
  if ($dockerEndpoint.Trim() -match '^(tcp|ssh)://') { throw "Remote Docker endpoint is forbidden: $dockerEndpoint" }

  function Invoke-Compose([string[]]$Arguments) {
    & docker compose --project-name flowline @Arguments
    if ($LASTEXITCODE -ne 0) { throw "docker compose failed: $($Arguments -join ' ')" }
  }

  Write-Output "CHAOS_START experiment=$Experiment"
  switch ($Experiment) {
    'worker-kill' {
      try {
        Invoke-Compose @('--profile','app','kill','--signal','SIGKILL','api')
        Start-Sleep -Seconds ([Math]::Min($DurationSeconds, 10))
      } finally {
        Invoke-Compose @('--profile','app','up','-d','api')
      }
    }
    'cache-outage' {
      try {
        Invoke-Compose @('--profile','data','stop','redis')
        Start-Sleep -Seconds $DurationSeconds
      } finally {
        Invoke-Compose @('--profile','data','start','redis')
      }
    }
    'cache-latency' {
      Invoke-Compose @('--profile','data','--profile','chaos','up','-d','redis','toxiproxy')
      $proxyUri = 'http://127.0.0.1:8474/proxies/redis-latency'
      try { Invoke-RestMethod -Method Get -Uri $proxyUri | Out-Null }
      catch {
        $proxy = @{ name='redis-latency'; listen='0.0.0.0:16379'; upstream='redis:6379'; enabled=$true } | ConvertTo-Json
        Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:8474/proxies' -ContentType 'application/json' -Body $proxy | Out-Null
      }
      try {
        $toxic = @{ name='bounded-latency'; type='latency'; stream='downstream'; toxicity=1.0; attributes=@{ latency=$LatencyMilliseconds; jitter=50 } } | ConvertTo-Json -Depth 3
        Invoke-RestMethod -Method Post -Uri "$proxyUri/toxics" -ContentType 'application/json' -Body $toxic | Out-Null
        Start-Sleep -Seconds $DurationSeconds
      } finally {
        try { Invoke-RestMethod -Method Delete -Uri "$proxyUri/toxics/bounded-latency" | Out-Null } catch { Write-Warning "Toxic cleanup needs inspection: $_" }
      }
    }
  }
  Write-Output 'CHAOS_CLEANUP_COMPLETE verify readiness, reconciliation, latency, errors and saturation before closing the experiment'
} finally {
  Pop-Location
}
