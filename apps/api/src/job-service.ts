import { createHash } from 'node:crypto';

export type SyncSource = 'ACCOUNT_AGGREGATOR' | 'CIBIL' | 'CRIF' | 'EXPERIAN' | 'EQUIFAX';
export type MockFailure = 'NONE' | 'TRANSIENT' | 'ALWAYS';

export interface SyncRequest {
  source: SyncSource;
  scope: 'PERSONAL' | 'CORPORATE';
  mockFailure?: MockFailure;
}

export interface SyncJob {
  id: string;
  idempotencyKey: string;
  source: SyncSource;
  scope: 'PERSONAL' | 'CORPORATE';
  status: 'SUCCEEDED' | 'FAILED';
  attempts: number;
  maxAttempts: number;
  errorCode?: string;
  createdAt: string;
  updatedAt: string;
}

export class IdempotencyConflictError extends Error {
  readonly code = 'IDEMPOTENCY_CONFLICT';
}

interface StoredJob {
  fingerprint: string;
  request: Required<SyncRequest>;
  job: SyncJob;
}

const CLOCK = '2026-08-12T08:30:00.000Z';

function fingerprint(request: Required<SyncRequest>): string {
  return createHash('sha256').update(JSON.stringify(request)).digest('hex');
}

export class InMemorySyncJobService {
  private readonly byKey = new Map<string, StoredJob>();
  private readonly byId = new Map<string, StoredJob>();

  submit(idempotencyKey: string, input: SyncRequest): SyncJob {
    if (!/^[A-Za-z0-9._:-]{8,128}$/.test(idempotencyKey)) throw new TypeError('Idempotency key must be 8-128 safe characters');
    const request: Required<SyncRequest> = { ...input, mockFailure: input.mockFailure ?? 'NONE' };
    const digest = fingerprint(request);
    const existing = this.byKey.get(idempotencyKey);
    if (existing) {
      if (existing.fingerprint !== digest) throw new IdempotencyConflictError('Idempotency key was already used for a different request');
      return existing.job;
    }

    const id = `sync_${createHash('sha256').update(idempotencyKey).digest('hex').slice(0, 16)}`;
    const stored: StoredJob = {
      fingerprint: digest,
      request,
      job: { id, idempotencyKey, source: request.source, scope: request.scope, status: 'FAILED', attempts: 0, maxAttempts: 3, createdAt: CLOCK, updatedAt: CLOCK },
    };
    this.byKey.set(idempotencyKey, stored);
    this.byId.set(id, stored);
    return this.execute(stored);
  }

  find(id: string): SyncJob | undefined {
    return this.byId.get(id)?.job;
  }

  retry(id: string): SyncJob | undefined {
    const stored = this.byId.get(id);
    if (!stored) return undefined;
    if (stored.job.status === 'SUCCEEDED' || stored.job.attempts >= stored.job.maxAttempts) return stored.job;
    return this.execute(stored);
  }

  private execute(stored: StoredJob): SyncJob {
    const attempts = stored.job.attempts + 1;
    const fails = stored.request.mockFailure === 'ALWAYS' || (stored.request.mockFailure === 'TRANSIENT' && attempts === 1);
    stored.job = {
      ...stored.job,
      attempts,
      status: fails ? 'FAILED' : 'SUCCEEDED',
      ...(fails ? { errorCode: stored.request.mockFailure === 'TRANSIENT' ? 'MOCK_TRANSIENT' : 'MOCK_PERMANENT' } : {}),
      updatedAt: CLOCK,
    };
    if (!fails) delete stored.job.errorCode;
    return stored.job;
  }
}
