import { AiPolicyError, type NarrativeRequest } from './contracts.ts';

export const AI_POLICY_VERSION = 'narrative-privacy-v1';

const prohibitedPatterns = [
  /\b\d{12,19}\b/u,
  /\b(?:cvv|pin|otp|password|secret|access[_ -]?token)\b/iu,
  /\b[A-Z]{5}\d{4}[A-Z]\b/u,
  /\b[A-Z]{4}0[A-Z0-9]{6}\b/u,
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/iu,
];

export function validateNarrativeRequest(request: NarrativeRequest): void {
  if (!/^[a-zA-Z0-9_-]{8,80}$/u.test(request.requestId)) throw new AiPolicyError('INVALID_REQUEST_ID', 'requestId must be an opaque identifier.');
  if (request.statements.length < 1 || request.statements.length > 20) throw new AiPolicyError('INVALID_STATEMENT_COUNT', 'Provide 1 to 20 derived statements.');
  if (!Number.isSafeInteger(request.maxOutputTokens) || request.maxOutputTokens < 32 || request.maxOutputTokens > 800) throw new AiPolicyError('INVALID_TOKEN_BUDGET', 'maxOutputTokens must be an integer between 32 and 800.');
  if (!Number.isSafeInteger(request.maxCostMinorUsd) || request.maxCostMinorUsd < 0 || request.maxCostMinorUsd > 50) throw new AiPolicyError('INVALID_COST_BUDGET', 'maxCostMinorUsd must be an integer between 0 and 50.');
  for (const statement of request.statements) {
    if (statement.length < 1 || statement.length > 280) throw new AiPolicyError('INVALID_STATEMENT', 'Each statement must be between 1 and 280 characters.');
    if (prohibitedPatterns.some((pattern) => pattern.test(statement))) throw new AiPolicyError('SENSITIVE_DATA_REJECTED', 'Raw identifiers, credentials, and secrets are prohibited from narrative requests.');
  }
}

export function redactStatements(statements: readonly string[]): string[] {
  return statements.map((statement) => statement.replace(/\b\d{5,}\b/gu, '[derived-value]'));
}
