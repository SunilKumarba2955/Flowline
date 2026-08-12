# Pull request review policy

## Separation of duties

The author owns implementation, debugging, unit/negative tests, component tests, integration tests, and end-to-end evidence. A different person performs the independent architecture/security review. A separate QA role performs exploratory black-box, accessibility, and manual acceptance testing. One person may hold multiple roles only while the repository has a single maintainer, but no author may approve their own PR and every exception/risk acceptance still records an explicitly independent decision before production use.

The reviewer examines every commit and the final aggregate diff. Approval applies only to the recorded head SHA; a material push after approval requires re-review. Conversations, requested changes, and failed checks must be resolved without deleting their history.

## Required repository controls

Configure the `main` ruleset in GitHub—not merely in documentation—to require:

1. Pull requests; no direct pushes, force pushes, or deletion.
2. At least one approving review and CODEOWNER review.
3. Dismiss stale approvals on new commits and require approval of the most recent push by someone other than its author.
4. All review conversations resolved.
5. Required checks for architecture/security, typecheck, unit/integration/component tests, build, end-to-end tests, dependency/secret scanning, and QA acceptance for release PRs.
6. Linear history, signed commits where identities support it, and merge queue for concurrent changes.
7. Administrator bypass disabled for ordinary delivery; emergency bypass is audited and followed by a retrospective.

Use `develop` as the integration branch. Short-lived `feature/<issue>-<slug>`, `fix/<issue>-<slug>`, and `chore/<issue>-<slug>` branches target `develop`. Only a reviewed release PR targets `main`; hotfixes branch from `main`, receive the same gates, and are merged back into `develop`. Do not create permanent branches per person or agent.

## Decision outcomes

- `APPROVE`: all required evidence is reproducible and no reject condition remains.
- `REQUEST_CHANGES`: remediable blocking findings exist; the author pushes fixes and requests another review.
- `REJECT`: the approach violates an invariant, trust boundary, consent/authorization rule, or accepted architecture and must be redesigned or covered by an approved, time-bounded exception where acceptance is permitted.

The automated gate is `node tests/architecture/pr-review-gate.mjs --all`. In a PR checkout it can also accept `--base <git-ref>` to report changed-file scope while still evaluating repository-wide invariants. Make its status check required in GitHub before enabling production delivery.

