# Omniscience Product Roadmap v1

## Product Thesis
Omniscience should evolve from a "visual dashboard" into an "agent operations system" with:
- reliable execution
- observable state and failures
- auditable actions
- low-friction operator control

## Current Gaps (P0)
1. Execution-View gap: board is visible, but lifecycle guardrails are weak.
2. Failure handling gap: limited retry/escalation/dead-letter behaviors.
3. Observability gap: feed exists, but alerting and SLO-like metrics are incomplete.
4. Governance gap: audit trail and permission boundaries need hardening.

## Phase 1 (This Week): Make It Operable
- [ ] Task template + Definition of Done (DoD) schema
- [ ] Operation audit trail (who/when/what changed)
- [ ] Alert center (failed/timeout/stalled heartbeat)
- [ ] API smoke check endpoint bundle

Deliverable: Operators can detect issues and close task loops without SSH.

## Phase 2 (Next 1-2 Weeks): Make It Reliable
- [ ] Retry policy and dead-letter queue for scheduled jobs
- [ ] Versioned task artifacts (compare/rollback)
- [ ] Agent controls: pause/resume/retry/cancel
- [ ] Search filters: time, agent, severity, status

Deliverable: predictable daily operation under multi-agent load.

## Phase 3 (Next 2-4 Weeks): Make It Scalable
- [ ] Workspace isolation (multi-project or multi-tenant ready)
- [ ] KPI board: success rate, first-pass rate, MTTR, queue latency
- [ ] Integration sync layer (GitHub/Notion/Telegram)
- [ ] Policy engine (routing task -> agent/model/tool profile)

Deliverable: reusable control plane for broader agent operations.

## Execution Rules
1. Prefer reversible changes first.
2. Ship small increments daily.
3. Always pair implementation with verification steps.
4. For destructive DB changes: backup + migration plan + rollback script mandatory.

## Daily Improvement Loop
- Inspect current bottleneck
- Pick 1-3 high-leverage tasks
- Ship at least 1 production-safe improvement
- Publish short daily report: done/blockers/next
