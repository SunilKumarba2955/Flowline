import Fastify from 'fastify';
import { NarrativeOrchestrator } from '../../../modules/ai-orchestration/src/orchestrator.ts';
import { AiPolicyError, type NarrativeRequest } from '../../../modules/ai-orchestration/src/contracts.ts';
import { DeterministicMockProvider } from '../../../modules/ai-orchestration/src/providers/mock-provider.ts';

export function buildOrchestratorApp() {
  const app = Fastify({ logger: false, bodyLimit: 32 * 1024 });
  const orchestrator = new NarrativeOrchestrator([new DeterministicMockProvider()], process.env.AI_EXTERNAL_PROVIDERS_ENABLED === 'true');

  app.get('/health', async () => ({ status: 'ok', mode: 'mock', externalProvidersEnabled: false }));
  app.post<{ Body: NarrativeRequest }>('/v1/narratives', async (request, reply) => {
    try {
      return await orchestrator.generate(request.body);
    } catch (error) {
      if (error instanceof AiPolicyError) return reply.code(422).send({ error: error.code, message: error.message });
      request.log.error({ err: error }, 'narrative generation failed');
      return reply.code(503).send({ error: 'GENERATION_UNAVAILABLE' });
    }
  });
  return app;
}
