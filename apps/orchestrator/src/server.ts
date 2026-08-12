import { buildOrchestratorApp } from './app.ts';

const port = Number(process.env.AI_ORCHESTRATOR_PORT ?? 4100);
const app = buildOrchestratorApp();
await app.listen({ host: process.env.AI_ORCHESTRATOR_HOST ?? '127.0.0.1', port });

const shutdown = async () => { await app.close(); process.exit(0); };
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
