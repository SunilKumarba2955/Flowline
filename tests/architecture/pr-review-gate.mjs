import { access, readFile, readdir, stat } from 'node:fs/promises';
import { constants } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const args = process.argv.slice(2);
const jsonOutput = args.includes('--json');
const baseIndex = args.indexOf('--base');
const requestedBase = baseIndex >= 0 ? args[baseIndex + 1] : undefined;
const policyPath = path.join(root, '.github', 'flowline-review-policy.json');
const issues = [];
const warnings = [];

function normalize(file) {
  return file.split(path.sep).join('/').replace(/^\.\//, '');
}

function report(rule, file, message, line) {
  issues.push({ severity: 'ERROR', rule, file: normalize(file), ...(line ? { line } : {}), message });
}

function lineAt(content, index) {
  return content.slice(0, index).split(/\r?\n/).length;
}

function runGit(gitArgs) {
  return spawnSync('git', gitArgs, { cwd: root, encoding: 'utf8', windowsHide: true });
}

async function isReadable(file) {
  try {
    await access(path.join(root, file), constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

async function walk(relativeDirectory, ignoredSegments) {
  const absolute = path.join(root, relativeDirectory);
  let entries;
  try {
    entries = await readdir(absolute, { withFileTypes: true });
  } catch {
    return [];
  }

  const files = [];
  for (const entry of entries) {
    const relative = normalize(path.join(relativeDirectory, entry.name));
    if (relative.split('/').some((segment) => ignoredSegments.has(segment))) continue;
    if (entry.isDirectory()) files.push(...await walk(relative, ignoredSegments));
    else if (entry.isFile()) files.push(relative);
  }
  return files;
}

function resolveRelativeImport(sourceFile, specifier) {
  if (!specifier.startsWith('.')) return undefined;
  return normalize(path.relative(root, path.resolve(root, path.dirname(sourceFile), specifier)));
}

function importsFrom(content) {
  const specifiers = [];
  const staticImport = /(?:import|export)\s+(?:type\s+)?(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/g;
  const dynamicImport = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  for (const expression of [staticImport, dynamicImport]) {
    for (const match of content.matchAll(expression)) specifiers.push({ specifier: match[1], index: match.index ?? 0 });
  }
  return specifiers;
}

function packageIsForbidden(specifier, blocked) {
  return blocked.some((entry) => entry.endsWith('/')
    ? specifier.startsWith(entry)
    : specifier === entry || specifier.startsWith(`${entry}/`));
}

function isInside(target, roots) {
  return roots.some((candidate) => target === candidate || target.startsWith(`${candidate}/`));
}

const policy = JSON.parse(await readFile(policyPath, 'utf8'));
const ignoredSegments = new Set(policy.generatedOrVendoredRoots);
const allFiles = await walk('.', ignoredSegments);
const fileSet = new Set(allFiles);

for (const artifact of policy.requiredArtifacts) {
  if (!await isReadable(artifact)) report('GOV-001', artifact, 'required architecture/security governance artifact is missing');
}

const codeownersPath = '.github/CODEOWNERS';
if (fileSet.has(codeownersPath)) {
  const owners = await readFile(path.join(root, codeownersPath), 'utf8');
  const requiredOwnership = [
    '*', '/apps/api/', '/apps/web/', '/modules/', '/packages/contracts/',
    '/database/', '/infra/', '/ops/', '/docs/architecture/', '/docs/security/',
    '/docs/governance/', '/tests/architecture/', '/.github/'
  ];
  for (const ownedPath of requiredOwnership) {
    const ownedLines = owners.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith('#'));
    if (!ownedLines.includes(`${ownedPath} ${policy.repositoryOwner}`)) {
      report('OWN-001', codeownersPath, `${ownedPath} must be owned by the real repository owner ${policy.repositoryOwner}`);
    }
  }
}

const gitProbe = runGit(['rev-parse', '--is-inside-work-tree']);
const hasGit = gitProbe.status === 0 && gitProbe.stdout.trim() === 'true';
let changedFiles = allFiles;
let scanMode = 'full tree (Git metadata unavailable)';

if (hasGit) {
  if (requestedBase) {
    const diff = runGit(['diff', '--name-only', '--diff-filter=ACMRTUXB', `${requestedBase}...HEAD`]);
    if (diff.status === 0) {
      changedFiles = diff.stdout.split(/\r?\n/).map(normalize).filter(Boolean);
      scanMode = `changed files from ${requestedBase}...HEAD`;
    } else {
      warnings.push(`Could not resolve --base ${requestedBase}; repository-wide invariants were still scanned.`);
      scanMode = `full tree (--base ${requestedBase} unresolved)`;
    }
  } else {
    const status = runGit(['status', '--porcelain']);
    if (status.status === 0 && status.stdout.trim()) {
      changedFiles = status.stdout.split(/\r?\n/).filter(Boolean).map((line) => normalize(line.slice(3)));
      scanMode = 'working-tree changes plus repository-wide invariants';
    } else {
      scanMode = 'full tree';
    }
  }
}

const textExtensions = new Set(['.cjs', '.css', '.graphql', '.html', '.js', '.json', '.jsx', '.md', '.mjs', '.ps1', '.sql', '.ts', '.tsx', '.yaml', '.yml']);
const sourceExtensions = new Set(['.cjs', '.js', '.jsx', '.mjs', '.ts', '.tsx']);
const secretRules = [
  ['SEC-001', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, 'private key material is committed'],
  ['SEC-002', /AKIA[0-9A-Z]{16}/, 'AWS access key-shaped credential is committed'],
  ['SEC-003', /gh[pousr]_[A-Za-z0-9_]{30,}/, 'GitHub token-shaped credential is committed'],
  ['SEC-004', /sk_live_[0-9A-Za-z]{16,}/, 'live Stripe secret-shaped credential is committed'],
  ['SEC-005', /AIza[0-9A-Za-z_-]{30,}/, 'Google API key-shaped credential is committed'],
  ['SEC-006', /xox[baprs]-[0-9A-Za-z-]{20,}/, 'Slack token-shaped credential is committed']
];

const knownUnapprovedDatastores = ['neo4j', 'mongodb', 'mongo:', 'cassandra', 'couchbase', 'arangodb', 'surrealdb', 'scylladb', 'dynamodb', 'firestore'];
const adrFiles = allFiles.filter((file) => /^docs\/architecture\/adr\/(?!TEMPLATE\.md$|README\.md$).+\.md$/.test(file));
const acceptedAdrText = (await Promise.all(adrFiles.map(async (file) => {
  const content = await readFile(path.join(root, file), 'utf8');
  return /^- Status:\s*Accepted\s*$/mi.test(content) ? content.toLowerCase() : '';
}))).join('\n');

for (const file of allFiles) {
  const extension = path.extname(file).toLowerCase();
  if (!textExtensions.has(extension) && path.basename(file) !== '.env.example' && path.basename(file) !== 'Dockerfile') continue;
  const metadata = await stat(path.join(root, file));
  if (metadata.size > 2_000_000) continue;
  const content = await readFile(path.join(root, file), 'utf8');

  for (const [rule, expression, message] of secretRules) {
    const match = content.match(expression);
    if (match?.index !== undefined) report(rule, file, message, lineAt(content, match.index));
  }

  if (sourceExtensions.has(extension) && file !== 'tests/architecture/pr-review-gate.mjs' && file !== 'tests/architecture/verify.mjs') {
    const dangerousCode = [
      ['SEC-010', /dangerouslySetInnerHTML\s*=/, 'untrusted HTML escape hatch is forbidden'],
      ['SEC-011', /\.innerHTML\s*=/, 'direct innerHTML assignment is forbidden'],
      ['SEC-012', /\beval\s*\(/, 'eval is forbidden'],
      ['SEC-013', /\bnew\s+Function\s*\(/, 'dynamic Function construction is forbidden']
    ];
    for (const [rule, expression, message] of dangerousCode) {
      const match = content.match(expression);
      if (match?.index !== undefined) report(rule, file, message, lineAt(content, match.index));
    }

    const sensitiveLog = content.match(/console\.(?:log|info|warn|error)\s*\([^\n]*(?:authorization|password|accessToken|refreshToken|pan|cvv|otp|pin)/i);
    if (sensitiveLog?.index !== undefined) report('SEC-014', file, 'potential credential/card/authentication data is written to a console log', lineAt(content, sensitiveLog.index));

    for (const imported of importsFrom(content)) {
      const { specifier } = imported;
      const target = resolveRelativeImport(file, specifier);
      if (isInside(file, policy.domainRoots)) {
        if (packageIsForbidden(specifier, policy.forbiddenDomainPackages)) {
          report('BOUND-001', file, `domain code imports forbidden framework/provider/infrastructure package '${specifier}'`, lineAt(content, imported.index));
        }
        if (target && isInside(target, ['apps', 'database', 'infra', 'ops'])) {
          report('BOUND-002', file, `domain code reaches outward into '${target}'`, lineAt(content, imported.index));
        }
      }
      if (file.startsWith('apps/web/src/') && target && isInside(target, policy.forbiddenWebRoots)) {
        report('BOUND-003', file, `web presentation code crosses directly into '${target}'`, lineAt(content, imported.index));
      }
      if (file.startsWith('apps/api/') && target && isInside(target, ['apps/web'])) {
        report('BOUND-004', file, `API code crosses into web presentation path '${target}'`, lineAt(content, imported.index));
      }
      if (file.startsWith('packages/contracts/') && target && isInside(target, policy.forbiddenContractRoots)) {
        report('BOUND-005', file, `contract package depends on implementation path '${target}'`, lineAt(content, imported.index));
      }
      if (file.startsWith('packages/design-system/') && target && isInside(target, policy.forbiddenDesignSystemRoots)) {
        report('BOUND-006', file, `design-system package depends on product implementation path '${target}'`, lineAt(content, imported.index));
      }
    }

    if (isInside(file, policy.authoritativeMoneyRoots)) {
      const numericProperty = /^\s*(?:readonly\s+)?([A-Za-z_$][\w$]*)\??:\s*number\b/gm;
      for (const match of content.matchAll(numericProperty)) {
        const name = match[1];
        const moneyLike = /(amount|balance|income|spend|saving|outstanding|principal|interest|price|fee|tax|payment|due|limit)/i.test(name);
        const ratioLike = /(rate|ratio|percentage|utilization|confidence|score|count|days|attempts|version|change|enquiries)$/i.test(name);
        if (moneyLike && !ratioLike && !/Minor(?:Units)?$/i.test(name)) {
          report('DATA-001', file, `authoritative money field '${name}' must be named with a Minor suffix and use safe integer validation`, lineAt(content, match.index ?? 0));
        }
      }
    }

    const bureauAverage = content.match(/\b(?:average|mean|avg)\w*\s*\(\s*[^\n)]*(?:bureau|cibil|crif|experian|equifax)|(?:bureau|cibil|crif|experian|equifax)[^\n;]{0,100}\.(?:reduce|average|mean)\s*\(/i);
    if (bureauAverage?.index !== undefined && !/\.test\.[cm]?[jt]sx?$/.test(file)) {
      report('DATA-002', file, 'bureau scores must remain independent and must not be averaged', lineAt(content, bureauAverage.index));
    }
  }

  if (extension === '.sql') {
    const unsafeMoneyColumn = /^\s*([a-z][\w]*(?:amount|balance|income|spend|saving|outstanding|principal|interest|price|fee|tax|payment|due|limit)[\w]*)\s+(numeric|decimal|real|float|double\s+precision)\b/gmi;
    for (const match of content.matchAll(unsafeMoneyColumn)) {
      report('DATA-003', file, `money column '${match[1]}' uses non-integer SQL type '${match[2]}'`, lineAt(content, match.index ?? 0));
    }
  }

  if (file === 'docker-compose.yml' || /package(?:-lock)?\.json$/.test(file)) {
    const lowered = content.toLowerCase();
    for (const datastore of knownUnapprovedDatastores) {
      if (lowered.includes(datastore) && !acceptedAdrText.includes(datastore.replace(':', ''))) {
        report('ARCH-001', file, `unapproved datastore '${datastore.replace(':', '')}' requires an accepted evidence-backed ADR`);
      }
    }
  }
}

const aiPolicy = policy.aiOrchestration;
if (aiPolicy) {
  const aiModuleFiles = allFiles.filter((file) => file.startsWith(`${aiPolicy.moduleRoot}/`) && sourceExtensions.has(path.extname(file).toLowerCase()));
  for (const file of aiModuleFiles) {
    const content = await readFile(path.join(root, file), 'utf8');
    for (const imported of importsFrom(content)) {
      if (imported.specifier.startsWith('node:') && !aiPolicy.allowedModuleBuiltins.includes(imported.specifier)) {
        report('AI-001', file, `AI policy/orchestration module imports unapproved Node capability '${imported.specifier}'`, lineAt(content, imported.index));
      }
    }
  }

  const contractsFile = `${aiPolicy.moduleRoot}/src/contracts.ts`;
  if (fileSet.has(contractsFile)) {
    const contracts = await readFile(path.join(root, contractsFile), 'utf8');
    for (const term of aiPolicy.prohibitedRawDataTerms) {
      const expression = new RegExp(`\\b${term}\\b`, 'i');
      const match = contracts.match(expression);
      if (match?.index !== undefined) report('AI-002', contractsFile, `AI request/result contract exposes prohibited raw-data field '${term}'`, lineAt(contracts, match.index));
    }
    for (const required of ['advisoryOnly: true', 'maxOutputTokens: number', 'maxCostMinorUsd: number']) {
      if (!contracts.includes(required)) report('AI-003', contractsFile, `AI contract must retain '${required}'`);
    }
  }

  const aiEnv = await readFile(path.join(root, '.env.example'), 'utf8');
  for (const disabled of ['AI_EXTERNAL_PROVIDERS_ENABLED=false', 'RUNPOD_ENABLED=false', 'AI_MAX_COST_MINOR_USD=0']) {
    if (!aiEnv.includes(disabled)) report('AI-004', '.env.example', `safe AI default '${disabled}' is required`);
  }
}

for (const file of allFiles.filter((entry) => /^docs\/governance\/(?:architecture-exception|risk-acceptance)-.+\.md$/i.test(entry))) {
  const content = await readFile(path.join(root, file), 'utf8');
  if (!/^- Status:\s*(?:Approved|Accepted)\s*$/mi.test(content)) continue;
  const expiry = content.match(/^- Expiry date:\s*(\d{4}-\d{2}-\d{2})\s*$/mi)?.[1];
  if (!expiry) report('GOV-010', file, 'approved exception/risk acceptance requires an ISO expiry date');
  else if (new Date(`${expiry}T23:59:59Z`) < new Date()) report('GOV-011', file, `exception/risk acceptance expired on ${expiry}`);
}

if (process.env.GITHUB_EVENT_PATH && await isReadable(path.relative(root, process.env.GITHUB_EVENT_PATH))) {
  try {
    const event = JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH, 'utf8'));
    if (event.pull_request) {
      const body = event.pull_request.body ?? '';
      for (const heading of ['## Outcome', '## Scope and architecture', '## Developer evidence (white-box)', '## Independent verification']) {
        if (!body.includes(heading)) report('PR-001', '.github/PULL_REQUEST_TEMPLATE.md', `PR description is missing required section '${heading}'`);
      }
    }
  } catch (error) {
    warnings.push(`Could not parse GITHUB_EVENT_PATH: ${error instanceof Error ? error.message : String(error)}`);
  }
}

const result = {
  ok: issues.length === 0,
  mode: scanMode,
  filesScanned: allFiles.length,
  changedFiles: changedFiles.filter((file) => fileSet.has(file)),
  issueCount: issues.length,
  issues,
  warnings
};

if (jsonOutput) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`Flowline architecture/security PR gate: ${result.ok ? 'PASS' : 'REJECT'}`);
  console.log(`Mode: ${scanMode}; scanned ${allFiles.length} files; ${result.changedFiles.length} file(s) in reported change scope.`);
  for (const warning of warnings) console.warn(`WARN: ${warning}`);
  for (const issue of issues) console.error(`${issue.severity} ${issue.rule} ${issue.file}${issue.line ? `:${issue.line}` : ''} - ${issue.message}`);
}

process.exit(issues.length ? 1 : 0);
