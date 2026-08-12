import { buildApi } from './app.ts';

const port = Number.parseInt(process.env.API_PORT ?? '4000', 10);
if (!Number.isInteger(port) || port < 1 || port > 65_535) throw new Error('API_PORT must be a valid TCP port');

const app = await buildApi({ logger: true, ...(process.env.WEB_ORIGIN ? { allowedOrigin: process.env.WEB_ORIGIN } : {}) });

const shutdown = async (signal: string) => {
  app.log.info({ signal }, 'graceful shutdown started');
  await app.close();
  process.exit(0);
};
process.once('SIGINT', () => void shutdown('SIGINT'));
process.once('SIGTERM', () => void shutdown('SIGTERM'));

await app.listen({ host: process.env.API_HOST ?? '127.0.0.1', port });
