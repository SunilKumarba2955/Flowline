# AI orchestration boundary

Flowline calculations, balances, eligibility rules, bill state, and risk decisions remain deterministic domain logic. Models may explain a precomputed result; they may not invent a financial fact, execute a transaction, approve credit, or become an authoritative calculator.

`apps/orchestrator` is a separate, lightweight HTTP service. `modules/ai-orchestration` owns provider-neutral contracts, privacy policy, routing, cost bounds, timeouts, and content-addressed short-lived caching. The only enabled local adapter is deterministic and costs nothing.

## Provider strategy

The stable provider contract supports `openai`, `gemini`, `anthropic`, `nemotron`, `ollama`, `kimi`, and `runpod`. Each future adapter must implement availability, model identity, external-data classification, price estimation, timeout/cancellation, retry classification, and normalized output. It must be introduced by its own reviewed PR with contract tests and an ADR when the data boundary changes.

Routing order is policy-driven, not hard-coded into product features. An external provider is eligible only when its global feature flag, individual provider flag, endpoint, and secret reference are configured. Requests have per-call token and cost ceilings. The service falls back to the deterministic provider; it does not silently send data elsewhere.

## Privacy and safety

- Only derived, non-identifying statements enter the service.
- Account/card numbers, PAN, IFSC, email, tokens, OTP, PIN, CVV, passwords, and raw transactions are rejected before routing.
- Prompts and model responses must not enter general application logs.
- Production audit records contain request ID, purpose, policy/model/provider versions, latency, token/cost counters, outcome, and consent reference—not prompt bodies.
- Provider retention/training must be contractually disabled where available.
- Advice is labelled advisory-only and retains the deterministic evidence that produced it.

## RunPod decision

RunPod stays disabled. A GPU pod is justified only by a benchmarked workload that cannot meet its SLO or cost envelope locally or through an existing API—for example private-model batch inference, multimodal evaluation, or Blender rendering. A RunPod ADR must define GPU type, image digest, network/secret isolation, warm/cold policy, maximum hourly spend, idle shutdown, artifact retention, and measured cost per accepted output. CI and ordinary tests never start a pod.

## MCP boundary

Do not expose financial commands through MCP yet. A future MCP server may expose read-only synthetic evaluation tools to internal QA agents, with explicit schemas, no credentials, bounded results, and the same audit/policy layer. Any write-capable tool requires a separate threat model and human confirmation design.
