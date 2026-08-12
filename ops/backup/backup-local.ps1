[CmdletBinding()]
param([string]$OutputRoot = '.local/backups')
$ErrorActionPreference = 'Stop'
if (-not (Test-Path -LiteralPath './docker-compose.yml')) { throw 'Run from the flowline root.' }
$appEnvironment = if ($env:APP_ENV) { $env:APP_ENV } else { 'local' }
if ($appEnvironment -notin @('local','demo','ci')) { throw 'This rehearsal script is restricted to local/demo/ci.' }
$stamp = (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')
$target = Join-Path (Resolve-Path (New-Item -ItemType Directory -Force -Path $OutputRoot)).Path $stamp
New-Item -ItemType Directory -Force -Path $target | Out-Null

docker compose exec -T postgres sh -ec 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom --file=/tmp/flowline.dump'
if ($LASTEXITCODE) { throw 'Postgres backup failed.' }
docker compose cp postgres:/tmp/flowline.dump (Join-Path $target 'postgres.dump')

foreach ($table in @('transaction_projection')) {
  docker compose exec -T clickhouse sh -ec "clickhouse-client --query='SELECT * FROM flowline_analytics.$table FORMAT Native' > /tmp/$table.native"
  if ($LASTEXITCODE) { throw "ClickHouse export failed: $table" }
  docker compose cp "clickhouse:/tmp/$table.native" (Join-Path $target "$table.native")
}

$resolvedTarget = (Resolve-Path $target).Path
$s3AccessKey = if ($env:S3_ACCESS_KEY_ID) { $env:S3_ACCESS_KEY_ID } else { 'flowline_local' }
$s3SecretKey = if ($env:S3_SECRET_ACCESS_KEY) { $env:S3_SECRET_ACCESS_KEY } else { 'flowline_local_only' }
$s3Bucket = if ($env:S3_BUCKET) { $env:S3_BUCKET } else { 'flowline-local' }
docker run --rm --network flowline_default `
  -e S3_ACCESS_KEY_ID=$s3AccessKey -e S3_SECRET_ACCESS_KEY=$s3SecretKey -e S3_BUCKET=$s3Bucket `
  -v "${resolvedTarget}:/backup" --entrypoint /bin/sh minio/mc:RELEASE.2024-08-26T10-49-58Z `
  -c 'mc alias set local http://minio:9000 "$S3_ACCESS_KEY_ID" "$S3_SECRET_ACCESS_KEY" && mc mirror --overwrite local/"$S3_BUCKET" /backup/minio'
if ($LASTEXITCODE) { throw 'MinIO backup failed. Ensure S3 environment variables are set.' }

$files = Get-ChildItem -LiteralPath $target -File -Recurse | Sort-Object FullName
$manifest = $files | ForEach-Object { "$(Get-FileHash -Algorithm SHA256 -LiteralPath $_.FullName | Select-Object -ExpandProperty Hash)  $($_.FullName.Substring($target.Length + 1).Replace('\','/'))" }
$manifest | Set-Content -Encoding utf8 -LiteralPath (Join-Path $target 'SHA256SUMS')
Write-Host "Backup completed: $target"
