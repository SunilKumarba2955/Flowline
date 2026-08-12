export type AiProviderId = 'mock' | 'openai' | 'gemini' | 'anthropic' | 'nemotron' | 'ollama' | 'kimi' | 'runpod';

export type NarrativePurpose = 'CASHFLOW_EXPLANATION' | 'CREDIT_EXPLANATION' | 'BILL_REMINDER' | 'SAVINGS_COACHING';

export interface NarrativeRequest {
  requestId: string;
  purpose: NarrativePurpose;
  locale: 'en-IN';
  statements: string[];
  preferredProvider?: AiProviderId;
  maxOutputTokens: number;
  maxCostMinorUsd: number;
}

export interface NarrativeResult {
  requestId: string;
  provider: AiProviderId;
  model: string;
  text: string;
  advisoryOnly: true;
  cached: boolean;
  estimatedCostMinorUsd: number;
  policyVersion: string;
}

export interface ProviderContext {
  signal: AbortSignal;
  redactedStatements: readonly string[];
}

export interface AiProvider {
  readonly id: AiProviderId;
  readonly model: string;
  readonly external: boolean;
  readonly estimatedCostMinorUsdPer1kTokens: number;
  isAvailable(): boolean;
  generate(request: NarrativeRequest, context: ProviderContext): Promise<string>;
}

export class AiPolicyError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = 'AiPolicyError';
  }
}
