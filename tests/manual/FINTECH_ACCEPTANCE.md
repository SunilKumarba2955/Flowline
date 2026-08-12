# Manual fintech acceptance pack

Use deterministic synthetic users only. Record build SHA, tester, browser/device, evidence link, and result for every run.

| ID | Scenario | Expected evidence |
|---|---|---|
| M-01 | First load and refresh each route | No blank state, duplicate request, or console error; selected route persists. |
| M-02 | Narrow mobile viewport and keyboard-only navigation | Focus is visible, menu traps no focus, headings are ordered, no horizontal clipping. |
| M-03 | `prefers-reduced-motion: reduce` | All values and warnings remain available; nonessential motion stops. |
| M-04 | Four bureau snapshots with different scores and timestamps | Each bureau retains its identity, freshness, and factors; no synthetic average appears. |
| M-05 | Credit utilization at 0%, 30%, 31%, 99%, and no reported limit | Boundary advice is stable; unknown is not represented as zero. |
| M-06 | Duplicate transaction import with same provider id | Exactly one authoritative transaction; duplicate audit signal exists. |
| M-07 | Reversed, refunded, pending, and partially settled debit | Cash flow and balance use lifecycle state, not blind summation. |
| M-08 | Corporate card transaction | Excluded from personal cash flow until explicit reclassification. |
| M-09 | Bill/EMI due across IST midnight, leap day, and holiday | Reminder and overdue status use Asia/Kolkata and explicit policy. |
| M-10 | Provider timeout, invalid signature, replay, and stale consent | Safe error, no partial commit, retry/idempotency evidence, auditable denial. |
| M-11 | Log and trace inspection after all above | No PAN, OTP, access token, raw bureau report, or unmasked account number. |
| M-12 | Export/delete consent flow | Scope and consequences are explicit; legal retention exceptions are surfaced. |
| M-13 | Backup restore rehearsal into an empty local stack | Checksums pass; counts and sampled hashes reconcile; source remains untouched. |
| M-14 | Redis outage and recovery | Authoritative reads remain correct or degrade explicitly; cache repopulates without stampede. |
| M-15 | API kill during a request | Client gets bounded retry/error; restarted service becomes ready; no duplicate decision. |

Release requires zero unresolved severity-1/2 defects, all money/idempotency cases automated, accessibility review complete, and a signed exception for every skipped case.
