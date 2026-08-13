[CmdletBinding()]
param(
  [Parameter(Mandatory)][string]$BackupPath,
  [Parameter(Mandatory)][string]$ConfirmToken,
  [ValidatePattern('^[a-z][a-z0-9_]*_restore$')][string]$TargetDatabase = 'flowline_restore'
)
$ErrorActionPreference = 'Stop'
if ($ConfirmToken -ne 'RESTORE-INTO-EMPTY-LOCAL') { throw 'Confirmation token mismatch.' }
if ($env:APP_ENV -notin @('local','demo','ci')) { throw 'Restore is restricted to local/demo/ci.' }
$source = (Resolve-Path -LiteralPath $BackupPath).Path
$manifestPath = Join-Path $source 'SHA256SUMS'
if (-not (Test-Path $manifestPath)) { throw 'Missing SHA256SUMS.' }
foreach ($line in Get-Content -LiteralPath $manifestPath) {
  $expected, $relative = $line -split '\s+', 2
  $actual = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $source $relative)).Hash
  if ($actual -ne $expected) { throw "Checksum mismatch: $relative" }
}

docker compose cp (Join-Path $source 'postgres.dump') postgres:/tmp/flowline.dump
$postgresUser = if ($env:POSTGRES_USER) { $env:POSTGRES_USER } else { 'flowline' }
docker compose exec -T postgres dropdb -U $postgresUser --if-exists $TargetDatabase
if ($LASTEXITCODE) { throw "Could not reset isolated restore database: $TargetDatabase" }
docker compose exec -T postgres createdb -U $postgresUser $TargetDatabase
if ($LASTEXITCODE) { throw "Could not create isolated restore database: $TargetDatabase" }
docker compose exec -T postgres pg_restore -U $postgresUser -d $TargetDatabase --no-owner /tmp/flowline.dump
if ($LASTEXITCODE) { throw 'Postgres restore failed.' }

foreach ($table in @('transaction_projection')) {
  docker compose cp (Join-Path $source "$table.native") "clickhouse:/tmp/$table.native"
  docker compose exec -T clickhouse sh -ec "clickhouse-client --multiquery --query='CREATE TABLE IF NOT EXISTS flowline_analytics.${table}_restore AS flowline_analytics.$table; TRUNCATE TABLE flowline_analytics.${table}_restore'; clickhouse-client --query='INSERT INTO flowline_analytics.${table}_restore FORMAT Native' < /tmp/$table.native"
  if ($LASTEXITCODE) { throw "ClickHouse restore failed: $table" }
}
Write-Host "Isolated restore completed in PostgreSQL database '$TargetDatabase' and ClickHouse *_restore tables. Reconcile before any promotion; restore MinIO separately per the runbook."
