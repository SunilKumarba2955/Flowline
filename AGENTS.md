# Flowline engineering rules

## Safety and data

- Do not open, parse, copy, or reference files outside this `flowline/` directory, especially the parent `data/` folder containing personal financial documents.
- Use deterministic synthetic data only until an explicit real-data milestone is approved.
- Never commit API keys, credentials, full PAN, CVV, PIN, OTP, passwords, raw provider access tokens, or real PII.
- Treat `.env.example` as a contract of placeholders. Local secrets belong only in ignored files; production secrets use a secrets manager.

## Architecture

- PostgreSQL is the authoritative store for financial facts, consent, decisions, and audit state.
- ClickHouse is an analytical projection, Redis/Valkey is disposable cache/coordination, and MinIO/S3 is the immutable encrypted-object adapter.
- Do not introduce another database unless an ADR states the query, SLO, ownership, consistency model, migration/rollback, and measured evidence.
- GraphQL is the typed client read/BFF surface, not a database. REST is used for health, metrics, webhooks, imports, and operational commands.
- Money uses integer minor units and an ISO currency. Do not use floating point for authoritative calculations.
- Four bureau scores remain independent snapshots; never average them.
- Corporate activity is excluded from personal cash flow unless explicitly reclassified.
- Domain code must not import a provider SDK, database client, web framework, queue, or UI library.

## Quality

- Every recommendation records evidence, freshness, rule/model version, confidence, and known uncertainty.
- Correctness-critical money, date, consent, authorization, idempotency, and reconciliation code requires negative/property tests.
- Chaos tests must have explicit targets, duration, abort conditions, and a demo/local environment guard.
- All UI motion must respect `prefers-reduced-motion`; meaning cannot depend on color or animation.
- No untrusted `innerHTML`.
- Do not claim production readiness when external contracts, legal onboarding, penetration tests, or real DR evidence are pending. Report readiness by layer and evidence.
