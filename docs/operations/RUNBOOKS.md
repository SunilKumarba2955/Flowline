# Operations runbooks index

Every incident uses correlation IDs, UTC/IST timestamps, severity, affected users/sources, decision owner, evidence location, containment, recovery, and post-incident actions. Security incidents start the CERT-In six-hour assessment clock when noticed/informed; the designated contact and counsel decide/report.

## Provider outage

1. Confirm platform health separately from provider health.
2. Open provider circuit/bulkhead; stop retry amplification.
3. Mark affected source degraded with last-good watermark.
4. Preserve durable jobs/cursors; do not fake refresh.
5. Re-enable half-open canary, reconcile counts/balances, then drain bounded backlog.

## Webhook replay or signature failures

1. Quarantine payload and metadata with redaction; never normalize it.
2. Verify clock/NTP, key version, timestamp window, and provider incident status.
3. Use idempotency/inbox evidence to prove whether any effect occurred.
4. Rotate/revoke secrets/certificates when compromise is suspected.

## Reconciliation mismatch

1. Freeze affected derived advice, not unrelated accounts.
2. Compare source hash/count/cursor, canonical ledger, transfers/reversals, and read-model watermark.
3. Repair through versioned reversal/supersession and rebuild the bounded projection.
4. Notify the user if a displayed decision materially changed.

## Database degradation

1. Shed optional analytics/narrative/enrichment traffic.
2. Bound connections and queues; preserve authoritative writes or fail them clearly.
3. Fail over only with evidence and the approved procedure.
4. Reconcile WAL/outbox/inbox and publish recovery/RPO evidence.

## Cache/ClickHouse/object-store outage

- Redis: bypass cache; enforce local/rate-limit fail policy; never reconstruct authority from cache.
- ClickHouse: show lag; serve PostgreSQL projections; pause long analytical jobs.
- Object store: pause/quarantine new imports/exports; existing normalized records continue.

## Suspected security/privacy incident

1. Page incident commander, security, privacy/legal, and CERT-In contact.
2. Contain credentials/egress/access without destroying evidence.
3. Preserve tamper-evident logs and chain of custody.
4. Determine data/purpose/users/providers/regions and regulatory clocks.
5. Communicate verified facts; supplement initial notices as evidence develops.

## Model/decision incident

1. Activate policy/model/provider kill switch and revert to deterministic baseline.
2. Preserve feature snapshot, versions, evidence, published copy, and user actions.
3. Identify affected population/decisions and correct/suppress safely.
4. Require risk/compliance/product approval before reactivation.
