# Independent QA and release governance

This policy separates developer verification from independent acceptance. Automated developer tests answer "does the implementation behave as designed?" Independent QA answers "does the immutable build satisfy the user, safety, privacy, and release contract?"

## Roles and separation of duties

| Role | Owns | Must not do |
|---|---|---|
| Developer/PR author | implementation, debugging, unit/component/contract/integration/E2E tests, developer evidence | apply `qa:approved`, approve their own PR, or edit independent evidence |
| Independent QA reviewer | black-box, exploratory, accessibility, privacy, failure-mode and manual acceptance; release evidence | change implementation on the PR branch or approve a head SHA they did not test |
| Maintainer/release manager | branch protection, reviewer assignment, exception register and merge | merge while a required gate is red or bypass a rejection without an audited emergency process |
| Security/privacy reviewer | threat, data-handling and regulatory gates for high-risk changes | substitute a generic code review for required specialist evidence |

No person or automation identity may perform both author and independent-approver roles for the same PR. LLM/provider diversity does not establish independence when the same operator controls both roles; GitHub identity, tested SHA, evidence, and approval are the audit boundary.

## Branch and review flow

1. Work starts from protected `develop` on `feature/<ticket>-<slug>`, `fix/<ticket>-<slug>`, or `chore/<ticket>-<slug>`.
2. The developer opens a PR to `develop`, completes white-box tests, and applies `qa:ready` only after developer CI is green.
3. Independent QA tests the exact PR head SHA in an isolated, synthetic-data environment. QA does not push to the developer branch.
4. A failure receives a `CHANGES_REQUESTED` review and `qa:rejected`. The author fixes it and requests a new run. Every new commit invalidates prior QA approval.
5. A passing reviewer submits an `APPROVED` review containing the evidence JSON and then applies `qa:approved`.
6. The independent gate verifies reviewer allow-list membership, author/reviewer separation, approval against the current head SHA, evidence integrity, and label ownership. Only then may the maintainer merge.
7. Release PRs from `develop` to protected `main` repeat independent acceptance against the release candidate. Hotfix branches start from `main`, merge to `main`, and are back-merged to `develop` after the same gates.

Configure repository variable `QA_REVIEWERS` as a comma-separated, case-insensitive allow-list of GitHub logins. Configure branch protection/rulesets for `develop` and `main` to:

- require pull requests and at least one approval;
- dismiss stale approvals on new commits and require approval of the most recent push;
- require conversation resolution and signed commits where organizational policy supports them;
- require developer CI and `independent-qa-gate / independent-signoff`;
- block force pushes, deletion, direct pushes, and administrator bypass;
- restrict merge authority to release maintainers.

The workflow fails closed when `QA_REVIEWERS` is absent. GitHub repository settings remain mandatory: a workflow cannot prevent an administrator from disabling its own protection.

## Black-box workflow

### 1. Intake and test charter

Record PR number, immutable head SHA, target branch, risk tier, changed capabilities, data classification, rollback path, developer evidence URLs, and explicitly excluded scope. Reject intake when the PR description or expected behavior is ambiguous.

Risk tiers:

- **Critical:** money correctness, authorization, consent, identity, provider ingestion, data deletion, reconciliation, backup/restore, schema migration, payments, or security boundary.
- **High:** credit advice, recommendations, corporate/personal isolation, notification timing, audit, caching consistency, deployment or observability.
- **Medium:** user workflow or API behavior without authoritative financial mutation.
- **Low:** isolated presentation or documentation with no decision, data, security, accessibility, or operational effect.

Critical/high changes require a second specialist review where applicable and cannot use a risk-reducing exception for missing money, privacy, authorization, or data-loss evidence.

### 2. Environment integrity

- Use deterministic synthetic data only.
- Record build SHA and confirm UI/API report or otherwise demonstrably correspond to that SHA.
- Use an isolated test environment; never point black-box tests at production financial data.
- Record OS, browser/device, viewport, locale/timezone, API mode, datastore mode, and feature flags.
- Capture console/network/server errors without recording tokens, account identifiers, raw bureau reports, or other sensitive data.

### 3. Required manual and exploratory checks

Use [the fintech acceptance pack](../../tests/manual/FINTECH_ACCEPTANCE.md) as the canonical case catalogue. Select all cases affected by the change and always run these release-candidate checks:

- **M-01/M-02/M-03:** routes, refresh, keyboard, narrow viewport and reduced motion.
- **M-04/M-08:** four bureau independence and personal/corporate isolation.
- **M-09:** IST due-date behavior and visible payment state.
- **M-11:** browser/server logs contain no secret or unmasked financial data.

For a full release candidate, execute M-01 through M-15. A `NOT_APPLICABLE` result needs a concrete scope reason; `NOT_RUN`, `BLOCKED`, or `FAIL` is not an acceptance result.

Exploratory charters must include:

- empty, stale, partial, duplicated, reversed, refunded and delayed data;
- repeated clicks, refresh/navigation during requests, offline/timeout and retry behavior;
- personal/work scope switching before and after navigation;
- boundary values, long text, zoom, keyboard-only, screen-reader semantics and reduced motion;
- unsupported operations and truthful demo/advisory language;
- direct API misuse for changed endpoints, including invalid types, oversized input and authorization boundaries.

### 4. Evidence capture

Evidence must be attributable, reproducible, non-sensitive, and tied to the current head SHA. Store large screenshots/traces in the CI artifact or approved evidence store; place durable URLs or artifact identifiers in the signoff JSON. Do not commit videos, raw network archives, or log dumps containing financial data.

The approval review body must contain exactly one evidence object between these markers:

````markdown
<!-- flowline-qa-evidence:start -->
```json
{ "schemaVersion": "1.0.0", "...": "see tests/quality/fixtures/valid-release-signoff.json" }
```
<!-- flowline-qa-evidence:end -->
````

Validate before approving:

```powershell
node tests/quality/validate-release-evidence.mjs path/to/evidence.json --pr 42 --sha <40-character-head-sha> --author developer-login --reviewer qa-login
```

The workflow revalidates the JSON carried by the GitHub approval; it never checks out or executes untrusted PR code under `pull_request_target`.

## Severity and release decision

| Severity | Definition | Gate |
|---|---|---|
| Sev-1 | security/privacy breach, corrupt or lost money/data, unauthorized action, systemic outage | reject; no exception |
| Sev-2 | core journey incorrect/unavailable, material calculation or advice error, rollback/recovery failure | reject; no exception for production release |
| Sev-3 | meaningful degraded behavior with a safe workaround | reject unless a named owner, deadline, user impact and release-manager exception are recorded |
| Sev-4 | cosmetic/copy issue without accessibility, trust, privacy or correctness impact | may accept with tracked issue |

Acceptance requires all applicable cases passing, no open Sev-1/2, no failed critical/high security finding, no unresolved money/consent/authorization/reconciliation discrepancy, and a reproducible rollback. Production authorization additionally requires every external gate in `docs/VERIFICATION.md`; a passing PR is not proof of regulatory or operational production readiness.

QA sets exactly one verdict:

- **ACCEPT:** all required evidence exists and the tested SHA meets the rubric.
- **REJECT:** a mandatory check failed, is blocked/not run, evidence is stale, or acceptance criteria are unmet.

Silence, an emoji, a label without an approval, an approval without valid evidence, or evidence from an older SHA is never acceptance.

## Evidence retention and audit

Retain release signoff, automated evidence links, exceptions, defect references and tested SHA for the financial/audit retention period approved by legal and security. GitHub artifacts are convenience evidence, not the sole long-term audit store. Evidence access must be least-privilege and integrity protected.

