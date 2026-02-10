# Contributing to Omniscience

Thanks for contributing.

## Ground Rules

- Keep changes small and reversible.
- Preserve run/task/audit traceability.
- Add tests or smoke-proof for behavior changes.
- Document new env vars and operational impact.

## Local Setup

```bash
cp .env.example .env
make up
make db-push
make db-seed
```

## Branch + PR Flow

1. Fork and create branch: `feat/<short-name>` or `fix/<short-name>`
2. Commit with clear scope messages
3. Ensure `npm run build` passes
4. Open PR with template filled

## PR Checklist

- [ ] Build passes (`npm run build`)
- [ ] Behavior tested locally
- [ ] Docs updated if API or ops changed
- [ ] No destructive migration without rollback plan
- [ ] Security impact assessed (auth/permissions/tokens)

## Areas We Need Help On

- OpenClaw adapters and execution integrations
- trace UX and observability
- production-safe migrations and rollback tooling
- docs and example scenarios
