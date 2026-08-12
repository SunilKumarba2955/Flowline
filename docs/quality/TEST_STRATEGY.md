# Test and release strategy

Risk determines depth. The pyramid is domain unit/property tests → repository/adapter contract tests → integration with real datastore versions → a small Playwright journey suite → deliberate k6/chaos/security exercises.

- Every change: formatting/typecheck, unit/negative tests, architecture guardrails, secret/dependency scan, deterministic build.
- Money/date/consent/idempotency: boundary tables, randomized invariants (integer conservation by currency, stable duplicate result, monotonic lifecycle), time zones/leap/DST/provider timestamps, concurrency and replay.
- Adapters: consumer-driven contracts with signed golden fixtures and malformed/oversized/stale/duplicate responses; no real PII in fixtures.
- Persistence: migrations forward/backward compatibility, query plans on production-shaped synthetic distributions, deadlock/retry, outbox crash points and projector replay.
- UI: accessibility semantics, keyboard/mobile/reduced motion, empty/loading/stale/error states, truthful provenance/freshness, visual checks only for stable critical layouts.
- Performance: smoke on PR; baseline/stress/spike/soak before release. Proposed API gate p95 <350 ms, p99 <800 ms, errors <1% at the declared test profile. Record hardware/dataset/build; never generalize laptop numbers.
- Resilience: run one guarded experiment at a time, max 60 seconds local blast radius, with hypothesis, steady-state measure, abort threshold and automatic cleanup. Nightly jobs validate guards; environment experiments require change approval.
- Security/privacy: SAST/SCA/SBOM/secret scan, BOLA/GraphQL limits/SSRF/upload cases, log/trace/backup canary scan, external penetration test before production.

Release gates: all required CI green, zero open Sev-1/2 defects, critical/high security fixed or time-bounded accountable exception, migration/rollback evidence, restore drill within objective, load evidence at forecast headroom, provider/legal/privacy approvals, runbook/on-call readiness. Flaky tests are quarantined with an owner/date and do not silently retry into green; Playwright retries preserve traces but first-attempt failure is reported.

