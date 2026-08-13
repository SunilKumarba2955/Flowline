# Flowline

Flowline is an India-first personal finance and credit-intelligence platform. The current build uses deterministic synthetic data while retaining production-shaped boundaries for regulated Account Aggregator, credit-bureau, bank-statement, notification, and payment-aggregator integrations.

## Architecture at a glance

- React/Vite PWA for the animated money narrative.
- Fastify + GraphQL BFF for typed client reads; REST for operations, ingestion, health, metrics, and webhooks.
- PostgreSQL for authoritative financial/consent/decision state.
- ClickHouse for analytical projections and high-volume longitudinal queries.
- Redis/Valkey for disposable cache, rate limiting, locks, and coordination.
- MinIO/S3 for encrypted immutable source objects and export/backup artifacts.
- Worker with transactional outbox/inbox semantics for ingestion, projections, obligations, decisions, and alerts.
- A documented AI narrative boundary in which models may explain derived facts but never calculate balances or authorize actions. Its experimental implementation remains a local companion pending migration to a separately governed repository.

See `docs/` for system architecture, database strategy, threat model, test strategy, chaos experiments, operations runbooks, and readiness evidence.

The proposed orchestrator contract anticipates multiple interchangeable providers and compute targets. No provider implementation, credential, or RunPod lifecycle automation is shipped in this repository; every external adapter requires its own reviewed onboarding work in the future orchestration repository. See `docs/architecture/AI_ORCHESTRATION.md`.

## Data safety

This repository must use synthetic data only. The parent workspace contains personal documents that are outside this project's allowed data boundary.

## Local start

Node.js 20.19+ is the only requirement for synthetic demo mode:

```powershell
npm install
npm run dev
```

Open `http://localhost:5173`. The React app calls the GraphQL API at `http://localhost:4000/graphql` and falls back to deterministic browser demo data when the API is unavailable. No bank credentials or production keys are required.

Copy `.env.example` to `.env` only when you are ready to configure providers. It names every endpoint, client credential, webhook secret, product/purpose code, and mTLS path required for AA, CIBIL, CRIF, Experian, Equifax, Razorpay, Stripe, and PayU; every live integration remains disabled by default.

Run the quality gates with:

```powershell
npm run typecheck
npm run test:unit
npm run test:integration
npm run test:component
npm run build
npm run test:e2e
npm run test:architecture
```

See `CONTRIBUTING.md` for branch ownership, developer/QA/reviewer separation, rejection criteria, and the protected-branch promotion flow.

`docker compose --profile data up -d --wait` starts the optional PostgreSQL, ClickHouse, Redis, and MinIO data plane. Add `--profile observability` for Prometheus, Grafana, Loki, and OpenTelemetry; add `--profile chaos` only for the documented experiments.

## Production-readiness definition

The repository is production-shaped, not automatically production-authorized. Live financial data remains gated by provider contracts/permitted purposes, India compliance review, real secrets/KMS, security assessment, capacity tests, and backup/DR evidence.
