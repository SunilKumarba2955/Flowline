# Guarded chaos experiments

Chaos is an evidence exercise, not random destruction. The local harness refuses to run unless all three controls match: `CHAOS_ENABLED=true`, `APP_ENV` is `local|demo|ci`, and `-ConfirmToken FLOWLINE-LOCAL-CHAOS`. It also rejects remote Docker endpoints, caps duration at 60 seconds, names only allowlisted Compose services, and uses `finally` cleanup.

Before every experiment record build/config, owner, hypothesis, steady-state query, expected degradation, abort threshold, maximum duration and dashboard link. Use synthetic data and one fault at a time. Abort immediately on suspected data exposure, incorrect authoritative values, error rate >5%, database saturation >80%, cleanup failure, or any impact outside the named local Compose project.

```powershell
$env:APP_ENV='local'
$env:CHAOS_ENABLED='true'
./ops/chaos/invoke-experiment.ps1 -Experiment worker-kill -ConfirmToken FLOWLINE-LOCAL-CHAOS -DurationSeconds 10 -Execute
./ops/chaos/invoke-experiment.ps1 -Experiment cache-outage -ConfirmToken FLOWLINE-LOCAL-CHAOS -DurationSeconds 15 -Execute
./ops/chaos/invoke-experiment.ps1 -Experiment cache-latency -ConfirmToken FLOWLINE-LOCAL-CHAOS -DurationSeconds 15 -LatencyMilliseconds 300 -Execute
```

| Experiment | Hypothesis | Steady state / recovery evidence |
|---|---|---|
| `worker-kill` | A killed API process is replaced; readiness returns within 30 seconds; no duplicate idempotent job appears | `/health/ready`, GraphQL synthetic, process restart count, duplicate-effect query |
| `cache-outage` | Losing disposable Redis cannot create a wrong balance/consent/decision; fallback is bounded | authoritative response comparison, DB pool/saturation, error and latency, cache warm rate |
| `cache-latency` | 300 ms proxy latency remains inside the cache deadline and opens the cache circuit without tying up the API | proxy timing, cache timeout/circuit metric, API p95/errors, DB saturation |

`cache-latency` affects clients configured with `REDIS_URL=redis://toxiproxy:16379`; direct `redis:6379` traffic is intentionally untouched. The current deterministic API has no Redis client, so cache experiments validate harness safety only until the real cache adapter lands. The current `worker-kill` target is the API process because no independent worker exists; switch the allowlisted target after the outbox worker is implemented. Omit `-Execute` to inspect the complete plan without contacting Docker.

After cleanup, observe for twice the fault duration, verify readiness and data reconciliation, attach metrics/log/trace screenshots, record actual recovery time and whether the hypothesis held. A failed hypothesis creates an owned reliability item; it is not rerun with looser thresholds merely to turn green.
