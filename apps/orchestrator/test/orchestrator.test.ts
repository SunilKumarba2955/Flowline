import { describe, expect, it } from 'vitest';
import { NarrativeOrchestrator } from '../../../modules/ai-orchestration/src/orchestrator.ts';
import { DeterministicMockProvider } from '../../../modules/ai-orchestration/src/providers/mock-provider.ts';

const validRequest = { requestId: 'req_demo_001', purpose: 'CASHFLOW_EXPLANATION' as const, locale: 'en-IN' as const, statements: ['Savings rate is above the recent synthetic baseline.'], maxOutputTokens: 180, maxCostMinorUsd: 0 };

describe('NarrativeOrchestrator', () => {
  it('uses the deterministic zero-cost provider and caches identical work', async () => {
    const service = new NarrativeOrchestrator([new DeterministicMockProvider()]);
    const first = await service.generate(validRequest);
    const second = await service.generate({ ...validRequest, requestId: 'req_demo_002' });
    expect(first.provider).toBe('mock');
    expect(first.advisoryOnly).toBe(true);
    expect(first.estimatedCostMinorUsd).toBe(0);
    expect(second.cached).toBe(true);
  });

  it('rejects credentials and raw financial identifiers before provider routing', async () => {
    const service = new NarrativeOrchestrator([new DeterministicMockProvider()]);
    await expect(service.generate({ ...validRequest, statements: ['OTP 123456 should be processed.'] })).rejects.toMatchObject({ code: 'SENSITIVE_DATA_REJECTED' });
  });

  it('falls back to mock when an external preferred provider is disabled', async () => {
    const service = new NarrativeOrchestrator([new DeterministicMockProvider()]);
    await expect(service.generate({ ...validRequest, preferredProvider: 'openai' })).resolves.toMatchObject({ provider: 'mock' });
  });
});
