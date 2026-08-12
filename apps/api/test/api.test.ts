import { afterEach, describe, expect, it } from 'vitest';
import { buildApi } from '../src/app.ts';

const apps: Awaited<ReturnType<typeof buildApi>>[] = [];
afterEach(async () => Promise.all(apps.splice(0).map((app) => app.close())));

describe('Flowline API', () => {
  it('serves liveness, readiness, and Prometheus metrics', async () => {
    const app = await buildApi(); apps.push(app);
    expect((await app.inject({ method: 'GET', url: '/health/live' })).statusCode).toBe(200);
    expect((await app.inject({ method: 'GET', url: '/health/ready' })).json()).toMatchObject({ status: 'ready' });
    expect((await app.inject({ method: 'GET', url: '/metrics' })).body).toContain('flowline_api_requests_total');
  });

  it('serves the dashboard through GraphQL', async () => {
    const app = await buildApi(); apps.push(app);
    const response = await app.inject({ method: 'POST', url: '/graphql', payload: { query: '{ dashboard(scope: PERSONAL) { scope currency monthlyIncomeMinor bureauReports { bureau score } riskAssessment { advisoryOnly roleOutputs { role } } } }' } });
    expect(response.statusCode).toBe(200);
    expect(response.json().data.dashboard).toMatchObject({ scope: 'PERSONAL', currency: 'INR', monthlyIncomeMinor: 242_000_00 });
    expect(response.json().data.dashboard.bureauReports).toHaveLength(4);
    expect(response.json().data.dashboard.riskAssessment.roleOutputs).toHaveLength(5);
  });

  it('filters REST dashboard scope', async () => {
    const app = await buildApi(); apps.push(app);
    const response = await app.inject({ method: 'GET', url: '/api/v1/dashboard?scope=CORPORATE' });
    expect(response.statusCode).toBe(200);
    expect(response.json().accounts.every((account: { scope: string }) => account.scope === 'CORPORATE')).toBe(true);
    expect(response.json().bureauReports).toEqual([]);
  });

  it('enforces REST idempotency semantics', async () => {
    const app = await buildApi(); apps.push(app);
    const headers = { 'idempotency-key': 'rest-idem-0001' };
    const first = await app.inject({ method: 'POST', url: '/api/v1/sync-jobs', headers, payload: { source: 'CIBIL', scope: 'PERSONAL' } });
    const replay = await app.inject({ method: 'POST', url: '/api/v1/sync-jobs', headers, payload: { source: 'CIBIL', scope: 'PERSONAL' } });
    const conflict = await app.inject({ method: 'POST', url: '/api/v1/sync-jobs', headers, payload: { source: 'CRIF', scope: 'PERSONAL' } });
    expect(first.statusCode).toBe(202);
    expect(replay.json()).toEqual(first.json());
    expect(conflict.statusCode).toBe(409);
  });
});
