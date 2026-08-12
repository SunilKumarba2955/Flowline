import type { AiProvider, NarrativeRequest, ProviderContext } from '../contracts.ts';

export class DeterministicMockProvider implements AiProvider {
  readonly id = 'mock' as const;
  readonly model = 'flowline-narrative-mock-v1';
  readonly external = false;
  readonly estimatedCostMinorUsdPer1kTokens = 0;

  isAvailable(): boolean { return true; }

  async generate(request: NarrativeRequest, context: ProviderContext): Promise<string> {
    if (context.signal.aborted) throw new DOMException('Generation aborted', 'AbortError');
    const prefix = request.purpose === 'CREDIT_EXPLANATION'
      ? 'Credit reports can differ by bureau and reporting date.'
      : request.purpose === 'BILL_REMINDER'
        ? 'A scheduled obligation is approaching.'
        : 'Your current money pattern has a useful planning signal.';
    return `${prefix} ${context.redactedStatements.join(' ')} This is guidance, not a transaction, lender decision, or guarantee.`;
  }
}
