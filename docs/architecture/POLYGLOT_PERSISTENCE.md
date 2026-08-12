# Polyglot persistence decision

PostgreSQL is authoritative. ClickHouse, Redis/Valkey, and S3/MinIO are rebuildable/supporting stores with explicit consistency and failure semantics.

| Technology | Bounded purpose | Key optimization | Failure policy |
|---|---|---|---|
| PostgreSQL | consent, accounts, ledger, obligations, recommendations, audit, outbox/inbox | composite/keyset indexes, incremental read models, transactional idempotency | fail financial writes safely; never accept an uncommitted partial truth |
| ClickHouse | long-range cash-flow/cohort/risk/decision scans | time partitioning, ordered analytical keys, materialized projections, columnar compression | surface watermark/lag; core product remains available |
| Redis/Valkey | disposable cache, rate limits, short leases, queue coordination | bounded TTL/versioned keys, LFU eviction | bypass to PostgreSQL; no correctness dependency |
| S3/MinIO | encrypted immutable source objects, exports, manifests, backup artifacts | content hashes, versioning, lifecycle/retention tiers | quarantine/retry ingest; normalized committed truth remains |

GraphQL is the typed client BFF, not a database. Search begins with PostgreSQL trigram/GIN. Relationship queries begin with relational adjacency lists and bounded recursive CTEs. A search or graph engine is introduced only after an ADR provides the measured query/SLO failure, consistency model, ownership, rebuild path, cost, and rollback.

Money is a safe integer in minor units. Source objects are immutable. Analytical and cache records include source watermark and projection version. Outbox consumers assume at-least-once delivery and use inbox/idempotency keys to make each business effect exactly once.

See [distributed-system strategies](./DISTRIBUTED_SYSTEM_STRATEGIES.md) for data structures, overload control, capacity, and extraction triggers.
