#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import process from "node:process";

const usage = "node tests/quality/validate-release-evidence.mjs <evidence.json> [--pr N] [--sha SHA] [--author LOGIN] [--reviewer LOGIN] [--release]";
const [evidencePath, ...rawArgs] = process.argv.slice(2);

if (!evidencePath || evidencePath.startsWith("--")) {
  console.error(usage);
  process.exit(2);
}

const options = { release: false };
for (let index = 0; index < rawArgs.length; index += 1) {
  const token = rawArgs[index];
  if (token === "--release") {
    options.release = true;
    continue;
  }
  if (!["--pr", "--sha", "--author", "--reviewer"].includes(token)) {
    console.error(`Unknown option: ${token}\n${usage}`);
    process.exit(2);
  }
  const value = rawArgs[index + 1];
  if (!value || value.startsWith("--")) {
    console.error(`Missing value for ${token}\n${usage}`);
    process.exit(2);
  }
  options[token.slice(2)] = value;
  index += 1;
}

const failures = [];
const isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const required = (object, keys, location) => {
  if (!isRecord(object)) {
    failures.push(`${location} must be an object`);
    return false;
  }
  for (const key of keys) if (!(key in object)) failures.push(`${location}.${key} is required`);
  return true;
};
const noExtra = (object, keys, location) => {
  if (!isRecord(object)) return;
  for (const key of Object.keys(object)) if (!keys.includes(key)) failures.push(`${location}.${key} is not allowed`);
};
const oneOf = (value, choices, location) => {
  if (!choices.includes(value)) failures.push(`${location} must be one of ${choices.join(", ")}`);
};
const nonEmpty = (value, location) => {
  if (typeof value !== "string" || value.trim() === "") failures.push(`${location} must be a non-empty string`);
};

let evidence;
try {
  evidence = JSON.parse(await readFile(evidencePath, "utf8"));
} catch (error) {
  console.error(`Cannot read valid JSON from ${evidencePath}: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(2);
}

validateEvidence(evidence, options, failures);

if (failures.length > 0) {
  console.error(failures.map((failure) => `FAIL: ${failure}`).join("\n"));
  process.exit(1);
}

console.log(`Independent QA evidence is valid for PR #${evidence.prNumber} at ${evidence.headSha}.`);

function validateEvidence(value, expected, errors) {
  const rootKeys = ["schemaVersion", "prNumber", "headSha", "riskTier", "testedAt", "tester", "environment", "developerEvidence", "manualCases", "defects", "nonFunctional", "decision"];
  if (!required(value, rootKeys, "evidence")) return;
  noExtra(value, rootKeys, "evidence");

  if (value.schemaVersion !== "1.0.0") errors.push("evidence.schemaVersion must equal 1.0.0");
  if (!Number.isInteger(value.prNumber) || value.prNumber < 1) errors.push("evidence.prNumber must be a positive integer");
  if (!/^[0-9a-f]{40}$/i.test(value.headSha ?? "")) errors.push("evidence.headSha must be a 40-character commit SHA");
  oneOf(value.riskTier, ["LOW", "MEDIUM", "HIGH", "CRITICAL"], "evidence.riskTier");
  if (typeof value.testedAt !== "string" || Number.isNaN(Date.parse(value.testedAt))) errors.push("evidence.testedAt must be an ISO date-time");

  if (expected.pr && value.prNumber !== Number(expected.pr)) errors.push(`evidence.prNumber does not match expected PR ${expected.pr}`);
  if (expected.sha && value.headSha.toLowerCase() !== expected.sha.toLowerCase()) errors.push("evidence.headSha does not match the current PR head");

  const testerKeys = ["githubLogin", "role", "independenceAttested"];
  if (required(value.tester, testerKeys, "evidence.tester")) {
    noExtra(value.tester, testerKeys, "evidence.tester");
    nonEmpty(value.tester.githubLogin, "evidence.tester.githubLogin");
    if (value.tester.role !== "INDEPENDENT_QA") errors.push("evidence.tester.role must equal INDEPENDENT_QA");
    if (value.tester.independenceAttested !== true) errors.push("evidence.tester.independenceAttested must be true");
    if (expected.reviewer && value.tester.githubLogin.toLowerCase() !== expected.reviewer.toLowerCase()) errors.push("evidence tester must match the approving reviewer");
    if (expected.author && value.tester.githubLogin.toLowerCase() === expected.author.toLowerCase()) errors.push("PR author cannot be the independent QA tester");
  }

  const environmentKeys = ["buildSha", "dataClass", "platform", "browsers", "apiMode"];
  if (required(value.environment, environmentKeys, "evidence.environment")) {
    noExtra(value.environment, environmentKeys, "evidence.environment");
    if (value.environment.buildSha?.toLowerCase() !== value.headSha?.toLowerCase()) errors.push("environment.buildSha must equal evidence.headSha");
    if (value.environment.dataClass !== "SYNTHETIC") errors.push("environment.dataClass must equal SYNTHETIC");
    nonEmpty(value.environment.platform, "evidence.environment.platform");
    if (!Array.isArray(value.environment.browsers) || value.environment.browsers.length === 0) errors.push("environment.browsers must contain at least one browser/device");
    else value.environment.browsers.forEach((item, index) => nonEmpty(item, `environment.browsers[${index}]`));
    oneOf(value.environment.apiMode, ["MOCK", "LOCAL_STACK", "PREVIEW"], "environment.apiMode");
  }

  if (!Array.isArray(value.developerEvidence) || value.developerEvidence.length === 0) errors.push("developerEvidence must contain at least one gate result");
  else value.developerEvidence.forEach((item, index) => {
    const location = `developerEvidence[${index}]`;
    const keys = ["gate", "status", "evidenceRef"];
    if (!required(item, keys, location)) return;
    noExtra(item, keys, location);
    nonEmpty(item.gate, `${location}.gate`);
    oneOf(item.status, ["PASS", "FAIL"], `${location}.status`);
    nonEmpty(item.evidenceRef, `${location}.evidenceRef`);
    if (value.decision?.verdict === "ACCEPT" && item.status !== "PASS") errors.push(`${location} must pass for ACCEPT`);
  });

  const seenCases = new Set();
  if (!Array.isArray(value.manualCases) || value.manualCases.length === 0) errors.push("manualCases must contain at least one case");
  else value.manualCases.forEach((item, index) => {
    const location = `manualCases[${index}]`;
    const keys = ["id", "result", "evidenceRefs", "notes"];
    if (!required(item, keys, location)) return;
    noExtra(item, keys, location);
    if (!/^M-[0-9]{2}$/.test(item.id ?? "")) errors.push(`${location}.id must match M-NN`);
    if (seenCases.has(item.id)) errors.push(`${location}.id duplicates ${item.id}`);
    seenCases.add(item.id);
    oneOf(item.result, ["PASS", "FAIL", "BLOCKED", "NOT_RUN", "NOT_APPLICABLE"], `${location}.result`);
    if (!Array.isArray(item.evidenceRefs)) errors.push(`${location}.evidenceRefs must be an array`);
    else {
      item.evidenceRefs.forEach((ref, refIndex) => nonEmpty(ref, `${location}.evidenceRefs[${refIndex}]`));
      if (item.result === "PASS" && item.evidenceRefs.length === 0) errors.push(`${location} needs evidence for PASS`);
    }
    nonEmpty(item.notes, `${location}.notes`);
    if (value.decision?.verdict === "ACCEPT" && ["FAIL", "BLOCKED", "NOT_RUN"].includes(item.result)) errors.push(`${location}.${item.result} is incompatible with ACCEPT`);
  });

  const coreCases = ["M-01", "M-02", "M-03", "M-04", "M-08", "M-09", "M-11"];
  if (value.decision?.verdict === "ACCEPT") {
    for (const id of coreCases) if (!seenCases.has(id)) errors.push(`ACCEPT evidence must include core case ${id}`);
  }
  if (expected.release) {
    for (let number = 1; number <= 15; number += 1) {
      const id = `M-${String(number).padStart(2, "0")}`;
      const testCase = value.manualCases?.find((item) => item.id === id);
      if (!testCase || testCase.result !== "PASS") errors.push(`release candidate requires ${id} PASS`);
    }
  }

  if (!Array.isArray(value.defects)) errors.push("defects must be an array");
  else value.defects.forEach((item, index) => {
    const location = `defects[${index}]`;
    const keys = ["id", "severity", "status", "summary", "owner", "exceptionRef"];
    if (!required(item, ["id", "severity", "status", "summary", "owner"], location)) return;
    noExtra(item, keys, location);
    nonEmpty(item.id, `${location}.id`);
    oneOf(item.severity, ["SEV1", "SEV2", "SEV3", "SEV4"], `${location}.severity`);
    oneOf(item.status, ["OPEN", "FIXED", "ACCEPTED_EXCEPTION"], `${location}.status`);
    nonEmpty(item.summary, `${location}.summary`);
    nonEmpty(item.owner, `${location}.owner`);
    if (["SEV1", "SEV2"].includes(item.severity) && item.status !== "FIXED") errors.push(`${location} ${item.severity} must be FIXED`);
    if (item.status === "ACCEPTED_EXCEPTION" && !item.exceptionRef) errors.push(`${location}.exceptionRef is required for an exception`);
    if (value.decision?.verdict === "ACCEPT" && item.status === "OPEN" && item.severity !== "SEV4") errors.push(`${location} open ${item.severity} is incompatible with ACCEPT`);
  });

  const nfrKeys = ["accessibility", "securityPrivacy", "performance", "resilience"];
  if (required(value.nonFunctional, nfrKeys, "nonFunctional")) {
    noExtra(value.nonFunctional, nfrKeys, "nonFunctional");
    for (const key of nfrKeys) {
      const result = value.nonFunctional[key];
      if (!required(result, ["status", "evidenceRef"], `nonFunctional.${key}`)) continue;
      noExtra(result, ["status", "evidenceRef"], `nonFunctional.${key}`);
      oneOf(result.status, ["PASS", "FAIL", "NOT_RUN", "NOT_APPLICABLE"], `nonFunctional.${key}.status`);
      nonEmpty(result.evidenceRef, `nonFunctional.${key}.evidenceRef`);
    }
    if (value.decision?.verdict === "ACCEPT") {
      for (const key of ["accessibility", "securityPrivacy"]) if (value.nonFunctional[key]?.status !== "PASS") errors.push(`nonFunctional.${key} must pass for ACCEPT`);
      if (["HIGH", "CRITICAL"].includes(value.riskTier)) {
        for (const key of ["performance", "resilience"]) if (value.nonFunctional[key]?.status !== "PASS") errors.push(`nonFunctional.${key} must pass for ${value.riskTier} ACCEPT`);
      }
    }
  }

  if (required(value.decision, ["verdict", "rationale", "exceptions"], "decision")) {
    noExtra(value.decision, ["verdict", "rationale", "exceptions"], "decision");
    oneOf(value.decision.verdict, ["ACCEPT", "REJECT"], "decision.verdict");
    nonEmpty(value.decision.rationale, "decision.rationale");
    if (!Array.isArray(value.decision.exceptions)) errors.push("decision.exceptions must be an array");
    else value.decision.exceptions.forEach((item, index) => nonEmpty(item, `decision.exceptions[${index}]`));
  }
}

