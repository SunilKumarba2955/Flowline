# Verification gate

This file distinguishes source/config validation from a fully executed dependency, integration, and production-readiness gate.

## Local prerequisites

- Node.js 20 or 22 LTS (the repository may also run on later versions, but CI pins an LTS line).
- npm 10+.
- Docker Engine with Compose v2 for the polyglot data profile.
- No real `.env`, credentials, or personal financial files inside this repository.

## Gate 0 — dependency-free inspection

These checks may run before packages or Docker are available:

```powershell
git diff --check
Get-ChildItem -Recurse -File | Select-String -Pattern 'Risk Taker|Wild One|Four Judges|Battlefield'
Get-ChildItem -Recurse -File | Select-String -Pattern 'BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY|AKIA[0-9A-Z]{16}'
docker compose config --quiet
```

Expected: no whitespace error, rejected-language result, secret result, or Compose validation error. The Compose check requires the Docker CLI but not necessarily running containers.

## Gate 1 — package integrity and static analysis

```powershell
npm ci
npm run typecheck
npm run lint --if-present
npm run build
```

Expected: exit code 0. Build artifacts appear only in package `dist/` directories and remain ignored.

## Gate 2 — automated correctness

```powershell
npm test
npm run test:contracts --if-present
npm run test:integration --if-present
npm run test:e2e --if-present
```

Required evidence:

- money uses safe integer minor units;
- owned transfers do not become income/spend;
- corporate scope remains excluded from personal cash flow;
- reversals/refunds reconcile;
- four bureau scores remain independent;
- recommendations carry evidence, freshness, version, confidence, and uncertainty;
- GraphQL and REST responses match the published contracts;
- keyboard navigation, reduced motion, and narrow/mobile layout pass;
- authorization and invalid-input negative tests pass.

## Gate 3 — local data-plane and resilience

```powershell
docker compose --profile data up -d --wait
npm run test:integration
npm run test:load:smoke
npm run chaos:worker-kill
npm run chaos:cache-outage
npm run backup:test
docker compose --profile data down
```

Required evidence:

- PostgreSQL authoritative write and outbox commit are atomic;
- repeated delivery creates one business effect;
- Redis outage falls back without incorrect values;
- ClickHouse lag is visible via watermark and does not block financial commands;
- object-store failure quarantines/retries ingestion;
- backup restore validates encryption, schema/migrations, hashes, and record counts;
- every chaos experiment records hypothesis, baseline, abort, result, and recovery time.

## Gate 4 — performance and capacity

Run the defined k6 profiles against representative deterministic datasets for read peak, ingestion peak, and analytical peak. Capture p50/p95/p99, errors, saturation, queue age, lock/I/O pressure, cache hit ratio, projection lag, and resource cost.

Minimum baseline targets:

- read-model/API p95 ≤ 300ms inside the platform;
- command API p95 ≤ 500ms inside the platform;
- useful dashboard content ≤ 2.5s on the selected mobile/network profile;
- provider receipt to visible data ≤ 2 minutes;
- zero silent ingestion loss.

## Gate 5 — real-data launch (external evidence)

Code tests cannot satisfy this gate alone:

- licensed/eligible AA/FIU and bureau permitted-purpose onboarding;
- legal/privacy/security review and final retention schedule;
- India-region production/DR configuration and vendor attestations;
- KMS/secrets manager and production identity/MFA;
- independent penetration test and remediation;
- PCI/acquirer/QSA scoping if payments are introduced;
- CERT-In contact, time sync, Indian log retention, incident exercise;
- executed restore and regional DR exercise with approved RPO/RTO;
- operational support, grievance, privacy-rights, and provider outage runbooks tested by humans.

Only after Gate 5 may the product be described as production-authorized for live financial data.

## Current environment note

On 13 August 2026, this Windows runner completed dependency installation and audit (zero known npm vulnerabilities), type checking, 20 unit/integration tests, both production builds, architecture guardrails, Compose configuration validation, API live smoke, and 18 Playwright journeys across desktop Chromium and Pixel 7. The browser run caught and drove fixes for an ISO timestamp rendering crash and an ambiguous navigation selector.

The Docker Engine/data-plane profile, k6 load profile, destructive chaos faults, encrypted production backup/restore, regional failover, and real-provider contract tests were not executed here. They remain release gates rather than inferred claims. The safe chaos harness was exercised in dry-run mode only.
