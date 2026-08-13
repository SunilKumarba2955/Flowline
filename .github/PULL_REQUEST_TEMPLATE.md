## Outcome

<!-- State the user or system outcome. Avoid a file-by-file narration. -->

## Scope and architecture

- Issue: Closes #000
- Change type: <!-- feature | fix | refactor | test | docs | infrastructure -->
- Architecture/ADR impact: <!-- none, or link the ADR -->
- Data classification and migration impact: <!-- synthetic-only / schema / retention / none -->
- Rollback approach:

## Developer evidence (white-box)

- [ ] I reviewed every commit and removed accidental or unrelated changes.
- [ ] Unit tests — command/result recorded below.
- [ ] Integration tests — command/result recorded below.
- [ ] Component tests — command/result recorded below.
- [ ] End-to-end tests — command/result recorded below.
- [ ] Typecheck, architecture guardrails, build, and dependency audit pass.
- [ ] New money/date/consent/idempotency logic includes negative or boundary tests.
- [ ] No real financial data, secrets, credentials, or provider tokens are present.

```text
npm run typecheck       ->
npm run test:unit       ->
npm run test:integration ->
npm run test:component  ->
npm run test:e2e        ->
npm run test:architecture ->
npm run build           ->
```

## Independent verification

- QA candidate commit SHA:
- Black-box automated evidence:
- Manual-test record/issue:
- Accessibility/security/resilience evidence where applicable:

## Reviewer decision

<!-- The author must not complete this section. A rejection returns the PR to its author. -->

- [ ] I inspected every commit and the complete diff.
- [ ] The change respects AGENTS.md, architecture boundaries, SOLID design, and repository conventions.
- [ ] Required evidence is credible and matches this exact head SHA.
- [ ] Approve, or request changes with blocking findings linked to code/test evidence.
