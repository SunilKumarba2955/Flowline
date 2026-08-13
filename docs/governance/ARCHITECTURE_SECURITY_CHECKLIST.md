# Architecture and security review checklist

Any checked reject condition blocks approval. Evidence means a command output, test, trace, query plan, migration rehearsal, or linked decision—not a claim in the PR description.

## Immediate rejection

- [ ] Secret, real PII, full PAN, CVV, PIN, OTP, password, or raw access token is committed, logged, or placed in a fixture.
- [ ] Authentication, object/field authorization, consent, tenant isolation, audit, or encryption is bypassed.
- [ ] Authoritative money uses floating point, omits ISO currency, or applies implicit/unstated rounding.
- [ ] Corporate activity is included in personal analytics without explicit, audited reclassification.
- [ ] Bureau scores are averaged or one bureau is presented as another.
- [ ] Domain code imports a UI/web framework, provider SDK, database/cache client, queue, or infrastructure adapter.
- [ ] A new datastore, public trust boundary, provider SDK, or consistency model lacks an accepted ADR and rollback evidence.
- [ ] A destructive/non-backward-compatible migration has no expand/contract plan, rehearsal, and verified restore path.
- [ ] The change executes financial actions automatically when its contract is advisory-only.
- [ ] Critical/high exploitable security risk is unresolved and has no permissible, accountable, unexpired acceptance.
- [ ] Tests/evidence are fabricated, disabled, broadly skipped, or made green by swallowing failures.

## Design and boundaries

- [ ] Responsibility is cohesive; policy, orchestration, transport, persistence, and presentation are separated.
- [ ] Dependencies point inward through narrow contracts; domain behavior is testable without network/framework/storage.
- [ ] Extension uses a strategy/adapter/port instead of provider conditionals spread through domain code.
- [ ] Interfaces are consumer-sized; substitutable implementations preserve error, retry, ordering, and consistency semantics.
- [ ] Public contract compatibility, versioning, deprecation, and rollback are explicit.
- [ ] Shared packages contain stable contracts/design primitives, not mutable business workflows or dumping-ground utilities.

## Financial data and decisions

- [ ] Integer minor-unit, ISO currency, sign/direction, timestamp/timezone, reversal, pending/posted, and duplicate invariants are tested.
- [ ] Every recommendation carries evidence, freshness, rule/model version, confidence, uncertainty, and advisory status.
- [ ] Derived projections can be rebuilt from the authoritative store; cache loss does not lose financial facts.
- [ ] Reconciliation exposes mismatches; idempotency keys bind to request fingerprints and replays are stable.
- [ ] Retention, deletion, consent revocation, purpose limitation, and audit records are represented in data flow and tests.

## Security and abuse resistance

- [ ] Authorization is tested for cross-user/cross-scope BOLA and GraphQL field/resolver access, not only route authentication.
- [ ] Inputs have type, size, depth/complexity, rate, and SSRF/file protections at the trust boundary.
- [ ] Provider calls use bounded timeouts, retry budgets with jitter, circuit breaking, replay/signature protection, and redacted errors.
- [ ] Logs/traces/metrics/backups are classified, redacted, access-controlled, encrypted, retained, and deletion-aware.
- [ ] Dependencies/images are pinned and scanned; secrets come from ignored local files or a production secret manager.

## Reliability, performance, and operations

- [ ] SLO/capacity assumptions are measurable; hot queries have representative query-plan/load evidence.
- [ ] Failure, timeout, partial success, retry exhaustion, dead letter, recovery, and rollback paths are observable and tested.
- [ ] Migrations and events are backward/forward compatible across rolling deployment.
- [ ] Chaos tests are environment-guarded, time-bounded, abortable, and clean up automatically.
- [ ] Backup is not claimed as recovery until an isolated restore and integrity check has succeeded.

## Test and review evidence

- [ ] Author tests cover success, negative, boundary, concurrency/replay, accessibility, and reduced-motion behavior as applicable.
- [ ] Independent QA records black-box/exploratory/manual results separately from author evidence.
- [ ] Reviewer inspected every commit, aggregate diff, generated artifacts, dependency/lockfile changes, and resolved discussions.
- [ ] ADRs, exceptions, and risk acceptances have real owners, independent approval, expiry, controls, and exit criteria.

