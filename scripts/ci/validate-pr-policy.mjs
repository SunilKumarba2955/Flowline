const base = process.env.PR_BASE ?? "";
const head = process.env.PR_HEAD ?? "";
const title = process.env.PR_TITLE ?? "";
const body = process.env.PR_BODY ?? "";
const draft = process.env.PR_DRAFT === "true";

const failures = [];
const allowedDevelopHeads = /^(feature|fix|refactor|chore|test|hotfix)\/[a-z0-9][a-z0-9._-]*$/;
const allowedMainHeads = /^(release\/[0-9]+\.[0-9]+\.[0-9]+(?:-[a-z0-9.-]+)?|hotfix\/[a-z0-9][a-z0-9._-]*)$/;
const conventionalTitle = /^(feat|fix|refactor|perf|test|docs|build|ci|chore|revert)(\([a-z0-9._/-]+\))?!?: .{8,}$/;

if (base === "develop" && !allowedDevelopHeads.test(head)) {
  failures.push(`PRs into develop must come from an approved work branch; received '${head}'.`);
}

if (base === "main" && !allowedMainHeads.test(head)) {
  failures.push(`PRs into main must come from release/* or hotfix/*; received '${head}'.`);
}

if (!conventionalTitle.test(title)) {
  failures.push("Use a Conventional Commit PR title, for example: feat(flow): add cash-flow forecast.");
}

if (!draft) {
  const requirements = [
    [/(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#\d+/i, "Link an issue with Closes/Fixes/Resolves #<number>."],
    [/- \[x\] I reviewed every commit/i, "Confirm that every commit was reviewed before requesting review."],
    [/- \[x\] Unit tests/i, "Confirm unit-test evidence."],
    [/- \[x\] Integration tests/i, "Confirm integration-test evidence."],
    [/- \[x\] Component tests/i, "Confirm component-test evidence."],
    [/- \[x\] End-to-end tests/i, "Confirm end-to-end test evidence."],
    [/- \[x\] No real financial data/i, "Confirm that no real financial data or secrets are included."],
  ];

  for (const [pattern, message] of requirements) {
    if (!pattern.test(body)) failures.push(message);
  }
}

if (failures.length > 0) {
  console.error("PR policy rejected this change:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(draft ? "Draft PR branch policy passed; evidence checklist is enforced when marked ready." : "PR topology and evidence policy passed.");
