# Backup and restore

## Production target

- PostgreSQL multi-AZ plus continuous WAL/PITR; encrypted daily snapshots retained 35 days initially.
- Versioned immutable S3 objects and backup manifests with schema/app/key versions, hashes, and counts.
- Copy to a separate account/project and second Indian region.
- ClickHouse is rebuilt from authoritative events/projections; Redis is never backed up as truth.
- KMS/key metadata and recovery access are protected separately and tested.
- Target after real-data pilot: RPO ≤5 minutes, RTO ≤60 minutes.

## Restore procedure

1. Create an isolated, access-restricted recovery environment in India.
2. Select recovery point and verify manifest signature, object hashes, key version, and chain of custody.
3. Restore PostgreSQL and objects; run forward-compatible migrations in rehearsal mode.
4. Validate constraints, record counts, monetary invariants, outbox/inbox positions, consent/revocation state, and audit continuity.
5. Rebuild ClickHouse/read models/cache; compare source watermarks.
6. Run smoke journeys and reconciliation samples; record achieved RPO/RTO.
7. Obtain incident/change approval before switching traffic.
8. Securely retire the recovery environment under retention policy.

Local/demo export must use reviewed authenticated encryption and a versioned manifest. Plain JSON backup/restore is prohibited. Run automated restore verification monthly, a full restore drill quarterly, and a regional DR exercise twice yearly. A backup is not considered valid until restoration and application-level invariants pass.

## Synthetic local rehearsal

The PowerShell scripts under `ops/backup/` are synthetic-data rehearsal tools, not the production backup service. `backup-local.ps1` is environment-guarded, exports a PostgreSQL custom-format dump, a rebuildable ClickHouse projection and versioned MinIO objects, then writes SHA-256 checksums. Redis is intentionally excluded because it is disposable.

1. Run `docker compose --profile data up -d --wait` and set `APP_ENV=local`.
2. Run `./ops/backup/backup-local.ps1`; keep its `.local/backups/<UTC>` output ignored and local.
3. Run `./ops/backup/restore-local.ps1 -BackupPath <path> -ConfirmToken RESTORE-INTO-EMPTY-LOCAL`.
4. The restore script recreates only a suffix-guarded PostgreSQL database named `flowline_restore` and ClickHouse `*_restore` tables. It does not overwrite the normal PostgreSQL database.
5. Restore MinIO separately into an isolated bucket after reviewing version semantics; reconcile schema, counts, money totals by currency, timestamps, sampled hashes, object checksums, outbox watermark, authorization and audit continuity.

Local files are not encrypted because only deterministic synthetic data is permitted in this repository. A production implementation must add KMS envelope encryption, signed manifests, cross-account object lock, monitoring, least privilege and automated isolated restore proof before live financial data is authorized.
