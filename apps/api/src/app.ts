import cors from '@fastify/cors';
import Fastify, { type FastifyInstance } from 'fastify';
import mercurius from 'mercurius';
import type { FinancialScope } from '../../../packages/contracts/src/index.ts';
import { DashboardService } from '../../../modules/finance/src/dashboard-service.ts';
import { DeterministicFinanceRepository } from '../../../modules/finance/src/mock-repository.ts';
import { IdempotencyConflictError, InMemorySyncJobService, type MockFailure, type SyncRequest, type SyncSource } from './job-service.ts';
import { schema } from './schema.ts';

interface BuildApiOptions {
  logger?: boolean;
  allowedOrigin?: string;
}

interface StartSyncGraphInput { source: SyncSource; scope: FinancialScope; mockFailure?: MockFailure }

const validScope = new Set<FinancialScope>(['PERSONAL', 'CORPORATE', 'ALL']);
const validSource = new Set<SyncSource>(['ACCOUNT_AGGREGATOR', 'CIBIL', 'CRIF', 'EXPERIAN', 'EQUIFAX']);
const validMockFailure = new Set<MockFailure>(['NONE', 'TRANSIENT', 'ALWAYS']);

function parseScope(value: unknown): FinancialScope {
  if (typeof value !== 'string' || !validScope.has(value as FinancialScope)) throw new TypeError('scope must be PERSONAL, CORPORATE, or ALL');
  return value as FinancialScope;
}

function parseSyncRequest(value: unknown): SyncRequest {
  if (typeof value !== 'object' || value === null) throw new TypeError('body must be an object');
  const input = value as Record<string, unknown>;
  if (typeof input.source !== 'string' || !validSource.has(input.source as SyncSource)) throw new TypeError('unsupported sync source');
  const scope = parseScope(input.scope);
  if (scope === 'ALL') throw new TypeError('sync scope must be PERSONAL or CORPORATE');
  if (input.mockFailure !== undefined && (typeof input.mockFailure !== 'string' || !validMockFailure.has(input.mockFailure as MockFailure))) throw new TypeError('invalid mockFailure');
  return { source: input.source as SyncSource, scope, ...(input.mockFailure ? { mockFailure: input.mockFailure as MockFailure } : {}) };
}

export async function buildApi(options: BuildApiOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger: options.logger ?? false, trustProxy: true });
  const dashboardService = new DashboardService(new DeterministicFinanceRepository());
  const jobService = new InMemorySyncJobService();
  const startedAt = Date.now();
  let requestCount = 0;
  let errorCount = 0;

  await app.register(cors, { origin: options.allowedOrigin ?? 'http://127.0.0.1:5173', methods: ['GET', 'POST'] });
  app.addHook('onRequest', async () => { requestCount += 1; });
  app.addHook('onError', async () => { errorCount += 1; });

  const dashboard = (_: unknown, args: { scope?: FinancialScope }) => dashboardService.getDashboard(args.scope ?? 'ALL');
  await app.register(mercurius, {
    schema,
    graphiql: process.env.APP_ENV !== 'production',
    queryDepth: 12,
    resolvers: {
      Query: {
        dashboard,
        accounts: (_: unknown, args: { scope?: FinancialScope }) => dashboardService.getDashboard(args.scope ?? 'ALL').accounts,
        cards: (_: unknown, args: { scope?: FinancialScope }) => dashboardService.getDashboard(args.scope ?? 'ALL').cards,
        bureauReports: () => dashboardService.getDashboard('PERSONAL').bureauReports,
        transactions: (_: unknown, args: { scope?: FinancialScope; accountId?: string; needsReview?: boolean; limit?: number }) => {
          if ((args.limit ?? 50) < 1 || (args.limit ?? 50) > 200) throw new TypeError('limit must be between 1 and 200');
          return dashboardService.getDashboard(args.scope ?? 'ALL').recentTransactions
            .filter((item) => args.accountId === undefined || item.accountId === args.accountId)
            .filter((item) => args.needsReview === undefined || item.needsReview === args.needsReview)
            .slice(0, args.limit ?? 50);
        },
        bills: (_: unknown, args: { scope?: FinancialScope }) => dashboardService.getDashboard(args.scope ?? 'ALL').bills,
        recommendations: (_: unknown, args: { scope?: FinancialScope }) => dashboardService.getDashboard(args.scope ?? 'ALL').recommendations,
        riskAssessment: (_: unknown, args: { scope?: FinancialScope }) => dashboardService.getDashboard(args.scope ?? 'ALL').riskAssessment,
        syncJob: (_: unknown, args: { id: string }) => jobService.find(args.id),
      },
      Mutation: {
        startMockSync: (_: unknown, args: { idempotencyKey: string; input: StartSyncGraphInput }) => jobService.submit(args.idempotencyKey, parseSyncRequest(args.input)),
        retryMockSync: (_: unknown, args: { id: string }) => jobService.retry(args.id),
      },
    },
  });

  app.get('/health', async () => ({ status: 'ok', mode: 'synthetic', checks: { api: 'up', mockRepository: 'up' } }));
  app.get('/health/live', async () => ({ status: 'ok' }));
  app.get('/health/ready', async (_request, reply) => reply.code(200).send({ status: 'ready', dependencies: { mockRepository: 'ready' } }));
  app.get('/metrics', async (_request, reply) => {
    const lines = [
      '# HELP flowline_api_up Whether the API process is up.',
      '# TYPE flowline_api_up gauge',
      'flowline_api_up 1',
      '# HELP flowline_api_requests_total Requests observed by this process.',
      '# TYPE flowline_api_requests_total counter',
      `flowline_api_requests_total ${requestCount}`,
      '# HELP flowline_api_errors_total Request errors observed by this process.',
      '# TYPE flowline_api_errors_total counter',
      `flowline_api_errors_total ${errorCount}`,
      '# TYPE process_uptime_seconds gauge',
      `process_uptime_seconds ${Math.floor((Date.now() - startedAt) / 1000)}`,
      '',
    ];
    return reply.type('text/plain; version=0.0.4; charset=utf-8').send(lines.join('\n'));
  });
  app.get('/api/v1/dashboard', async (request) => {
    const query = request.query as { scope?: string };
    return dashboardService.getDashboard(parseScope(query.scope ?? 'ALL'));
  });
  app.post('/api/v1/sync-jobs', async (request, reply) => {
    const rawKey = request.headers['idempotency-key'];
    const idempotencyKey = Array.isArray(rawKey) ? rawKey[0] : rawKey;
    if (!idempotencyKey) return reply.code(400).send({ code: 'IDEMPOTENCY_KEY_REQUIRED', message: 'Idempotency-Key header is required' });
    const job = jobService.submit(idempotencyKey, parseSyncRequest(request.body));
    return reply.code(202).send(job);
  });
  app.get('/api/v1/sync-jobs/:id', async (request, reply) => {
    const job = jobService.find((request.params as { id: string }).id);
    return job ?? reply.code(404).send({ code: 'NOT_FOUND', message: 'Sync job not found' });
  });
  app.post('/api/v1/sync-jobs/:id/retry', async (request, reply) => {
    const job = jobService.retry((request.params as { id: string }).id);
    return job ?? reply.code(404).send({ code: 'NOT_FOUND', message: 'Sync job not found' });
  });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof IdempotencyConflictError) return reply.code(409).send({ code: error.code, message: error.message });
    if (error instanceof TypeError) return reply.code(400).send({ code: 'INVALID_ARGUMENT', message: error.message });
    const statusCandidate = typeof error === 'object' && error !== null && 'statusCode' in error
      ? (error as { statusCode?: unknown }).statusCode
      : undefined;
    const statusCode = typeof statusCandidate === 'number' ? statusCandidate : 500;
    const message = error instanceof Error ? error.message : 'Unexpected server error';
    return reply.code(statusCode).send({ code: statusCode >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR', message: statusCode >= 500 ? 'Unexpected server error' : message });
  });

  return app;
}
