import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "AGENTS.md", ".env.example", "docker-compose.yml", "package-lock.json",
  ".github/workflows/ci.yml", ".github/workflows/independent-qa-gate.yml", ".github/workflows/resilience.yml",
  "docs/architecture/POLYGLOT_PERSISTENCE.md", "docs/security/THREAT_MODEL.md",
  "docs/operations/RUNBOOKS.md", "docs/operations/BACKUP_RESTORE.md", "docs/operations/CHAOS_ENGINEERING.md",
  "tests/e2e/playwright.config.ts", "tests/load/api-smoke.js",
  "ops/chaos/invoke-experiment.ps1"
];
const failures = [];

for (const file of required) {
  try { await access(path.join(root, file), constants.R_OK); }
  catch { failures.push(`missing required artifact: ${file}`); }
}

const env = await readFile(path.join(root, ".env.example"), "utf8");
for (const provider of ["AA", "CIBIL", "CRIF", "EXPERIAN", "EQUIFAX", "RAZORPAY", "STRIPE", "PAYU"]) {
  if (!env.includes(`${provider}_ENABLED=false`)) failures.push(`${provider} must default disabled`);
}
if (/SECRET(?:_KEY)?=(?!\r?$).+/m.test(env)) failures.push("example env appears to contain a populated secret");

const compose = await readFile(path.join(root, "docker-compose.yml"), "utf8");
for (const service of ["postgres:", "clickhouse:", "redis:", "minio:"]) {
  if (!compose.includes(service)) failures.push(`compose missing ${service}`);
}
if (/image:\s+[^\s]+:latest\b/.test(compose)) failures.push("compose images must not use latest tags");
if (/\bneo4j:/i.test(compose)) failures.push("Neo4j requires a measured ADR before deployment");
if (!compose.includes("API_HOST: 0.0.0.0")) failures.push("container API must bind beyond loopback");

const backup = await readFile(path.join(root, "ops/backup/backup-local.ps1"), "utf8");
if (!backup.includes("local','demo','ci")) failures.push("local backup rehearsal needs an environment guard");
const restore = await readFile(path.join(root, "ops/backup/restore-local.ps1"), "utf8");
if (!restore.includes("_restore$")) failures.push("restore target must be suffix guarded");

const sourceFiles = [
  "packages/contracts/src/index.ts",
  "modules/finance/src/domain.ts",
  "modules/finance/src/dashboard-service.ts",
  "modules/finance/src/mock-repository.ts"
];
const combinedSource = (await Promise.all(sourceFiles.map((file) => readFile(path.join(root, file), "utf8")))).join("\n");
for (const rejected of ["Risk Taker", "Wild One", "Four Judges", "Battlefield"]) {
  if (combinedSource.includes(rejected)) failures.push(`rejected legacy language present in source: ${rejected}`);
}
if (/\b(balance|amount|income|spend|savings|outstanding|limit|dues):\s*number\b/.test(combinedSource)) {
  failures.push("authoritative money fields must be explicitly named *Minor");
}
if (!combinedSource.includes("ruleVersion") || !combinedSource.includes("uncertainty") || !combinedSource.includes("freshnessAt")) {
  failures.push("recommendation contracts must preserve version, uncertainty, and freshness");
}
if (!combinedSource.includes("CIBIL") || !combinedSource.includes("CRIF") || !combinedSource.includes("EXPERIAN") || !combinedSource.includes("EQUIFAX")) {
  failures.push("all four independent bureau adapters/contracts must remain represented");
}

if (failures.length) {
  console.error(failures.map((failure) => `FAIL: ${failure}`).join("\n"));
  process.exit(1);
}
console.log(`Architecture guardrails passed (${required.length} artifacts, provider defaults, pinned images, approved stores).`);
