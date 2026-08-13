# Contributing to Flowline

Flowline uses evidence-based promotion. Writing code, independently testing a candidate, reviewing it, and authorizing a release are separate responsibilities. No agent or person approves their own change.

## Branch topology

| Branch | Created from | Purpose | Merges into |
|---|---|---|---|
| `main` | — | Protected, releasable history | — |
| `develop` | `main` | Protected integration branch | `release/*` |
| `feature/<issue>-<slug>` | `develop` | Product capability | `develop` |
| `fix/<issue>-<slug>` | `develop` | Non-production defect | `develop` |
| `refactor/<issue>-<slug>` | `develop` | Behavior-preserving design change | `develop` |
| `test/<issue>-<slug>` | `develop` | Developer-owned white-box test improvement | `develop` |
| `qa/<candidate>-<cycle>` | exact candidate SHA | Independent automation or durable test assets only; never product fixes | candidate branch by a separate PR |
| `release/<semver>` | `develop` | Frozen release candidate and release-only fixes | `main`, then back to `develop` |
| `hotfix/<issue>-<slug>` | `main` | Emergency production fix | `main`, then `develop` |

Use lowercase ASCII names. Do not commit directly to `main` or `develop`. Keep a branch focused on one issue and short-lived.

## Change lifecycle

1. Create an issue with measurable acceptance criteria, edge cases, data classification, and rollback expectations.
2. The developer creates a work branch from current `develop` and opens a draft PR early.
3. The developer implements the smallest coherent change and owns white-box validation: typecheck, unit, integration, component, E2E, architecture guardrails, and build.
4. Mark the PR ready only after its evidence checklist is complete. CI validates the exact head SHA.
5. An independent reviewer inspects every commit and the complete diff. Architecture, security, correctness, test quality, and maintainability violations require a `Request changes` decision.
6. The original developer corrects rejected work on the same branch, adds regression tests, and requests review again. Any new commit dismisses stale approval.
7. Independent QA validates the immutable candidate SHA with black-box automation and manual scenarios. QA reports defects; it does not silently repair product code in the test branch.
8. Merge only when all required developer gates, independent QA checks, conversations, and an approval from someone other than the last pusher are present.
9. Delete the merged work branch. Cut `release/<semver>` from `develop`; promote it to `main` without adding unreviewed features, then merge the release result back to `develop`.

## Local developer gate

Run from the repository root:

```powershell
npm ci
npm run typecheck
npm run test:unit
npm run test:integration
npm run test:component
npm run test:e2e
npm run test:architecture
npm run build
npm audit --audit-level=high
docker compose config --quiet
```

Test ownership is explicit:

- Unit: pure domain, policy, money, date, mapping, and idempotency behavior in isolation.
- Integration: HTTP/GraphQL composition, adapters, repositories, migrations, queues, and real datastore versions as those adapters are introduced.
- Component: rendered UI behavior, accessibility semantics, errors, loading, empty state, and reduced motion.
- E2E: a small set of customer journeys through public boundaries on desktop and mobile.

Never weaken, skip, or replace an assertion merely to make CI green. A flaky test needs an owner, linked issue, expiry date, and retained first-failure evidence.

## Commit and PR rules

Use Conventional Commit subjects, for example `feat(flow): explain recurring-payment forecast`. Make commits small enough to review but complete enough to build. Do not combine formatting churn with functional changes. Rebase on the target before final review; do not rewrite commits after approval.

PRs must link an issue, state rollback and data impact, include exact command results, and identify the candidate SHA used by QA. Generated reports are uploaded as CI artifacts; never commit secrets, personal financial data, production payloads, or machine-local outputs.

## Review rejection criteria

Reviewers must request changes when a PR breaks an `AGENTS.md` rule; crosses domain/provider/persistence boundaries without an approved design; uses floating point for authoritative money; averages bureau scores; mixes corporate and personal flows; lacks negative/boundary tests; hides uncertainty or provenance; introduces unbounded queries or retries; weakens authorization, consent, idempotency, audit, backup, accessibility, or observability; contains secrets/PII; or changes behavior without trustworthy evidence.

Approval applies only to the reviewed head SHA. The author cannot approve or merge their own PR.
