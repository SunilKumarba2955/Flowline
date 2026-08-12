# GitHub branch protection contract

Configure GitHub rulesets after the workflows exist on the default branch. Repository files can define check names and ownership, but only repository administrators can enforce the ruleset.

## `develop`

- Require a pull request; prohibit direct pushes and force pushes.
- Require at least one approval and code-owner review.
- Dismiss stale approvals and require approval of the most recent reviewable push by someone other than its pusher.
- Require conversation resolution, non-draft PRs, and branches to be up to date.
- Require signed commits when every automation identity supports them.
- Block deletion and disallow bypass except a documented break-glass owner.
- Require these stable checks:
  - `pr-policy / topology-and-template`
  - `developer-gates / typecheck`
  - `developer-gates / unit`
  - `developer-gates / integration`
  - `developer-gates / component`
  - `developer-gates / build-and-policy`
  - `developer-gates / e2e`
  - Independent QA checks defined by the QA workflow

## `main`

Apply every `develop` rule, allow only `release/*` and `hotfix/*` PR heads, require the independent QA/manual-acceptance check, and require two approvals for changes touching money, identity, consent, authorization, persistence, migrations, encryption, or provider adapters.

Use squash merge for work branches after every commit has been reviewed. Use a merge commit for an approved release so its candidate lineage remains visible. Disable merge commits for ordinary feature PRs and disable rebase merging. Automatically delete merged work branches.

## Reviewer controls

The `CODEOWNERS` file currently names the repository owner as the minimum reviewer. Replace or supplement it with real GitHub teams such as `@org/flowline-reviewers`, `@org/flowline-security`, and `@org/flowline-data` before adding collaborators. A bot may summarize a change, but approval must come from an accountable identity that did not author or last push it.

Never grant a model, agent, CI workflow, or RunPod worker an unrestricted repository token. Use a GitHub App with short-lived, least-privilege credentials: read code/checks for test workers; `checks:write` only for evidence publishers; no `contents:write` or `pull_requests:write` for reviewers.
