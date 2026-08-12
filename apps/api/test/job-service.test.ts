import { describe, expect, it } from 'vitest';
import { IdempotencyConflictError, InMemorySyncJobService } from '../src/job-service.ts';

describe('InMemorySyncJobService', () => {
  it('returns the same result for the same key and payload', () => {
    const service = new InMemorySyncJobService();
    const first = service.submit('idem-key-0001', { source: 'CIBIL', scope: 'PERSONAL' });
    const replay = service.submit('idem-key-0001', { source: 'CIBIL', scope: 'PERSONAL' });
    expect(replay).toEqual(first);
    expect(replay.attempts).toBe(1);
  });

  it('rejects reuse of a key for a different payload', () => {
    const service = new InMemorySyncJobService();
    service.submit('idem-key-0002', { source: 'CIBIL', scope: 'PERSONAL' });
    expect(() => service.submit('idem-key-0002', { source: 'CRIF', scope: 'PERSONAL' })).toThrow(IdempotencyConflictError);
  });

  it('recovers a deterministic transient failure on retry', () => {
    const service = new InMemorySyncJobService();
    const first = service.submit('idem-key-0003', { source: 'EXPERIAN', scope: 'PERSONAL', mockFailure: 'TRANSIENT' });
    expect(first.status).toBe('FAILED');
    const retry = service.retry(first.id);
    expect(retry?.status).toBe('SUCCEEDED');
    expect(retry?.attempts).toBe(2);
  });

  it('caps retries for a persistent failure', () => {
    const service = new InMemorySyncJobService();
    const first = service.submit('idem-key-0004', { source: 'EQUIFAX', scope: 'PERSONAL', mockFailure: 'ALWAYS' });
    service.retry(first.id);
    const third = service.retry(first.id);
    const fourth = service.retry(first.id);
    expect(third?.attempts).toBe(3);
    expect(fourth?.attempts).toBe(3);
    expect(fourth?.status).toBe('FAILED');
  });
});
