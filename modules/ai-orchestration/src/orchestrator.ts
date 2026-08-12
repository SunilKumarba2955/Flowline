import { createHash } from 'node:crypto';
import { AI_POLICY_VERSION, redactStatements, validateNarrativeRequest } from './policy.ts';
import { AiPolicyError, type AiProvider, type AiProviderId, type NarrativeRequest, type NarrativeResult } from './contracts.ts';

interface CachedNarrative { expiresAt: number; result: NarrativeResult }

export class NarrativeOrchestrator {
  private readonly providers = new Map<AiProviderId, AiProvider>();
  private readonly cache = new Map<string, CachedNarrative>();

  constructor(providers: readonly AiProvider[], private readonly externalProvidersEnabled = false, private readonly timeoutMs = 8_000) {
    for (const provider of providers) {
      if (this.providers.has(provider.id)) throw new Error(`Duplicate AI provider: ${provider.id}`);
      this.providers.set(provider.id, provider);
    }
  }

  async generate(request: NarrativeRequest): Promise<NarrativeResult> {
    validateNarrativeRequest(request);
    const key = this.cacheKey(request);
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) return { ...cached.result, cached: true };

    const provider = this.selectProvider(request.preferredProvider);
    const estimatedCost = Math.ceil((request.maxOutputTokens / 1_000) * provider.estimatedCostMinorUsdPer1kTokens);
    if (estimatedCost > request.maxCostMinorUsd) throw new AiPolicyError('COST_BUDGET_EXCEEDED', 'Selected provider exceeds the request cost budget.');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const text = await provider.generate(request, { signal: controller.signal, redactedStatements: redactStatements(request.statements) });
      const result: NarrativeResult = { requestId: request.requestId, provider: provider.id, model: provider.model, text, advisoryOnly: true, cached: false, estimatedCostMinorUsd: estimatedCost, policyVersion: AI_POLICY_VERSION };
      this.cache.set(key, { result, expiresAt: Date.now() + 5 * 60_000 });
      return result;
    } finally {
      clearTimeout(timeout);
    }
  }

  private selectProvider(preferred?: AiProviderId): AiProvider {
    const order: AiProviderId[] = preferred ? [preferred, 'mock'] : ['mock'];
    for (const id of order) {
      const provider = this.providers.get(id);
      if (!provider?.isAvailable()) continue;
      if (provider.external && !this.externalProvidersEnabled) continue;
      return provider;
    }
    throw new AiPolicyError('NO_PROVIDER_AVAILABLE', 'No policy-approved AI provider is available.');
  }

  private cacheKey(request: NarrativeRequest): string {
    return createHash('sha256').update(JSON.stringify({ purpose: request.purpose, locale: request.locale, statements: request.statements, provider: request.preferredProvider, maxOutputTokens: request.maxOutputTokens })).digest('hex');
  }
}
