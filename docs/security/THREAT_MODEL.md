# Threat model — synthetic build and real-data target

Method: trust boundaries plus STRIDE-oriented abuse cases. Real provider launch requires a reviewed, diagrammed threat model and penetration test.

## Assets and boundaries

- Restricted: identity/KYC identifiers, consent artefacts, provider tokens/certificates.
- Sensitive financial: transactions, balances, reports, obligations, decision evidence.
- Trust boundaries: browser↔API, API↔stores, worker↔providers, webhooks, statement upload/parser, exports/backups, operations console, optional AI narrative.

## Principal threats and controls

| Threat | Controls | Verification |
|---|---|---|
| Tenant/object ID enumeration | ownership/attribute checks on every object; opaque IDs; rate limits; RLS defence-in-depth | negative authorization/E2E tests |
| Forged/replayed webhook | signature and timestamp window, nonce/idempotency, strict schema/body limits, provider kill switch | replay/malformed contract and chaos tests |
| Statement parser attack | encrypted object quarantine, MIME/magic/size checks, isolated no-egress parser, decompression/page limits, malware scan | hostile corpus/fuzz tests |
| Stored/injected content | output encoding, CSP, no untrusted `innerHTML`, parameterized queries, provider anti-corruption layer | SAST, E2E payload tests |
| Credential/secret leakage | no password/PIN/OTP/CVV/full PAN collection; secret manager references; redaction; egress controls | secret scan, log canaries |
| Decision manipulation | immutable feature snapshot, evidence refs, rule/model version, risk challenger, invariant/QA gate | deterministic replay and metamorphic tests |
| AI prompt/data exfiltration | only redacted validated findings; deny raw files/transactions; schema-constrained output; numeric/claim diff guard | injection/canary tests |
| Export/backup disclosure | authenticated encryption, passphrase/KMS policy, signed manifest/hash, temporary URLs, access audit | isolated restore test |
| Insider/support misuse | least privilege, JIT access, MFA, dual control for sensitive operations, append-only audit | quarterly access review/tabletop |
| Availability/provider cascade | bulkheads, timeouts, bounded retry/jitter, circuit breakers, admission/load shedding, freshness UI | load/chaos programme |

## Prohibited storage

Bank passwords, transaction/UPI PINs, OTPs, private keys entered by users, CVV, full PAN, full magnetic track, and literal production secrets in Git/database/logs are prohibited. Provider credentials remain server-side in a secrets manager; browser `VITE_*` values are public configuration only.

## India controls

Plan India-region financial/payment data and backups, CERT-In-aligned time sync and 180-day+ Indian security log archive, auditable consent/revocation, full DPDP target-state rights/security/breach flows, contracted AA/FIU and bureau permitted-purpose paths, and hosted/tokenised payments to minimize PCI scope. Counsel and partners must confirm final applicability.
