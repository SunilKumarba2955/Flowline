# Architecture decision records

ADRs record decisions whose consequences outlive one pull request. Copy `TEMPLATE.md` to `NNNN-short-title.md`; never edit the template in place.

Use an ADR before adding a datastore, broker, external provider SDK, cross-module dependency, new consistency model, trust boundary, public API compatibility break, or material operating-cost commitment. The PR links the ADR and keeps it in `Proposed` status until the independent reviewer accepts both the decision and its evidence.

Statuses are `Proposed`, `Accepted`, `Superseded`, `Deprecated`, or `Rejected`. Accepted ADRs are immutable except for status and links to a superseding ADR. A decision that temporarily violates an accepted rule also needs a time-bounded architecture exception.

