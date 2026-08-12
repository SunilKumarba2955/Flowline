# Distributed-system and optimization strategies

Status: target architecture plus executable local subset. Any component labelled “later” requires a measured trigger and ADR before deployment.

## 1. Strategy portfolio

The system supports three deployment strategies without changing the domain contracts.

### Strategy A — compact local / early pilot

```text
React PWA → API/BFF → PostgreSQL
                  ↘ in-process bounded cache
                  ↘ encrypted local object adapter
                  ↘ worker in the same deployable release
```

Use when: synthetic development, a single user, early internal pilot.  
Benefits: smallest footprint, cheapest, easiest transactions and debugging.  
Limit: API and worker share a release; analytics remain small.

### Strategy B — production baseline

```text
CDN/PWA → load balancer → stateless API replicas → PostgreSQL primary/standby
                                      │              ↘ read replica
                                      ├→ Redis/Valkey
                                      ├→ India S3 object store
                                      └→ outbox → worker pool → ClickHouse projections
```

Use when: consented real-data closed pilot through early commercial scale.  
Benefits: independent API/worker scaling, analytical isolation, multi-AZ recovery, low operational complexity.  
Consistency: PostgreSQL is strong/authoritative; caches and ClickHouse are explicitly eventual and carry watermarks.

### Strategy C — extracted services

Extract only measured hot/security boundaries: ingestion, credit reports, notifications, analytical feature computation, or payment reconciliation. Each service owns its state contract and communicates with versioned events. Add a broker only when PostgreSQL outbox polling no longer meets throughput/consumer isolation needs.

Use when: independent teams, provider-specific availability/security, sustained volume, or different runtime needs.  
Cost: network failures, schema evolution, distributed tracing, duplicate delivery, reconciliation, and more on-call surfaces.

## 2. Data-store responsibilities

| Store | Role | Consistency | Failure behavior |
|---|---|---|---|
| PostgreSQL | authoritative users, consent, accounts, ledger, obligations, decisions, audit/outbox | strong transaction boundary | financial writes stop safely; reads may use last valid read model |
| ClickHouse | time-series/aggregate projections, long-range cohorts, model/decision analysis | eventual with source watermark | insights degrade; money truth and commands continue |
| Redis/Valkey | bounded caches, rate limits, short leases, coordination | disposable/eventual | bypass cache, fall back to PostgreSQL; avoid correctness locks |
| S3/MinIO | encrypted raw statement/report objects, manifests, exports, backup artifacts | immutable/versioned objects | ingestion quarantines/retries; existing normalized facts remain |
| PostgreSQL graph projection | transfers, merchant relationships, household/workspace links | authoritative edges in relational form | GraphQL traversals remain bounded |
| Optional graph engine | fraud/relationship traversal only after measured evidence | rebuilt projection | never authoritative; system operates without it |

GraphQL is an API surface, not a database. It enables the client to retrieve a typed view across bounded contexts without exposing data-store topology.

## 3. Consistency and delivery

- Authoritative financial commands and their outbox event commit in one PostgreSQL transaction.
- Workers claim events using `FOR UPDATE SKIP LOCKED`, a bounded batch, visibility timeout, and heartbeat.
- Consumers use an inbox/idempotency record keyed by `(consumer, event_id)`.
- At-least-once delivery is assumed; business effects become exactly-once through idempotency.
- ClickHouse rows include source event ID, source commit timestamp, projection version, and watermark.
- GraphQL responses include `asOf`, `freshness`, and degraded-source states.
- Caches use versioned keys including tenant/workspace and projection watermark.
- No distributed two-phase commit. Cross-module workflows use explicit state machines and compensating actions only where required.

## 4. Data-structure choices

### Ledger/deduplication

- Provider ID unique index: exact duplicate detection in O(log n) database lookup.
- SHA-256 deterministic fingerprint: provider, account, minor-unit amount, currency, normalized description, posting window.
- In-memory hash set per ingestion page avoids repeated database probes.
- Optional Bloom filter can reject obvious non-members only as a performance hint; database uniqueness remains the correctness boundary.
- Union-find (disjoint-set) can group candidate transaction lifecycle events within a bounded import, while persisted explicit links remain authoritative.

### Schedules and obligations

- A min-heap in a worker tracks the soonest in-memory due item for efficient scheduling.
- PostgreSQL indexed `next_action_at` is authoritative and supports crash recovery.
- A timing wheel becomes useful only for millions of short-lived timers; it is unnecessary initially.

### Forecasts and aggregates

- Immutable daily buckets are updated incrementally from affected postings.
- Prefix sums answer arbitrary date-window cash-flow totals in O(1) after O(n) daily series preparation.
- Rolling windows update in O(1) per day rather than rescanning transactions.
- Heavy cohort/group queries run in ClickHouse using partition pruning and materialized projections.

### Merchant/category lookup

- Normalized merchant aliases use indexed exact lookup first.
- PostgreSQL trigram/GIN search handles corrections and fuzzy discovery.
- A search cluster is introduced only if measured queries/volume violate the SLO.

### Relationship queries

- Adjacency lists in PostgreSQL model account-transfer, merchant, reimbursement, and household relationships.
- Recursive CTEs have strict depth/result/time limits.
- Add a graph projection only for repeated deep traversals that are proven to outperform relational queries and have a complete rebuild path.

## 5. Hot-path optimization

### Daily briefing

Do not join raw transactions at request time. Read one versioned briefing projection containing balances, protected floor, next obligations, forecast floor, top recommendation IDs, and source watermarks. Fetch recommendation evidence only on drill-down.

### Transaction feed

- composite index `(workspace_id, posted_at DESC, id DESC)`;
- keyset cursor `(posted_at, id)`;
- bounded filters and page sizes;
- projection for merchant/category display names to avoid N+1;
- raw payload loaded from object storage only when authorized and requested.

### Credit centre

- newest snapshot index by `(workspace_id, bureau, as_of DESC)`;
- tradelines versioned per report and compared asynchronously;
- comparison projection stores facts/discrepancies, never an averaged score;
- raw bureau object is encrypted and access-audited.

### Recommendation engine

- feature snapshots are immutable and content-addressed;
- rules are compiled/versioned and evaluated only when their dependent features change;
- a dependency map prevents recomputing unrelated rules;
- conflicting actions are resolved by safety, time-to-impact, certainty, and explicit policy priority;
- narrative text is rendered from validated results after decisions, never before.

## 6. Overload and provider isolation

- per-provider bulkheads and concurrency limits;
- deadlines propagate from HTTP to database/provider calls;
- retries only for classified transient errors, bounded with exponential backoff and jitter;
- circuit breakers expose open/half-open state and freshness degradation;
- queue admission control and maximum age stop an outage from becoming an unbounded backlog;
- weighted fair scheduling prevents a slow bureau/provider from starving bank syncs;
- load shedding drops optional enrichment/narrative work before authoritative ingestion;
- provider callbacks acknowledge only after durable validation/quarantine.

## 7. Chaos engineering programme

The equivalent of Chaos Monkey is not random destruction. It is a controlled experiment with a hypothesis, narrow blast radius, observable abort conditions, and recovery evidence.

Initial experiments:

1. Kill a worker after it claims an outbox batch; prove another worker reclaims it without duplicate business effects.
2. Add 1–3 seconds latency to Redis; prove cache bypass protects API latency/correctness.
3. Stop Redis; prove authoritative reads continue.
4. Delay ClickHouse projection; prove the UI displays the projection watermark and money commands remain correct.
5. Return malformed provider data; prove quarantine, redacted evidence, and no canonical partial write.
6. Replay a signed webhook; prove idempotent response and single effect.
7. Break object-store access during statement ingest; prove the job retries/quarantines and no phantom transactions appear.
8. Force PostgreSQL connection exhaustion in local/CI; prove admission control and recovery without silent loss.
9. Simulate clock skew; prove signed-callback rejection and NTP alert.
10. Restore an encrypted backup into an isolated environment; prove hashes, migrations, record counts, and usability.

Never run chaos against production until game-day approval, rollback/abort automation, on-call staffing, and baseline SLO evidence exist.

## 8. “Binary encoding” strategy

Use compact binary formats only where they improve a measured boundary:

- JSON/GraphQL remains the external developer/client interface for debuggability.
- Internal event schemas may use Protobuf after service extraction, with compatibility checks and a schema registry.
- Analytical exports use Parquet for columnar compression and ClickHouse loading.
- Raw provider payloads are retained in their signed/original format when permitted; a content hash binds the normalized record to the source.
- Never invent a custom financial binary format or encryption scheme. Custom codecs create compatibility/security risk and rarely beat established Protobuf/Parquet/Zstandard combinations.

## 9. Capacity model

Before real launch, test three shapes rather than one average:

- read peak: morning/dashboard refresh fan-out;
- ingestion peak: salary day and provider webhook batch;
- analytical peak: long-range recalculation/model/risk job.

Measure p50/p95/p99, saturation, queue age, database locks/I/O, cache effectiveness, projection lag, and cost per active user. Scale only the saturated resource. Keep at least 30% headroom at expected peak and test graceful shedding beyond it.
