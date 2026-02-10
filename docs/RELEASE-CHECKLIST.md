# Release Checklist

Use this checklist before tagging or announcing a release.

## 1) Local quality gate

```bash
npm run verify:full
```

Expected:
- verify passes (`/login`, `/api/system/health` reachable)
- lint has **0 errors** (warnings acceptable but should be reviewed)
- build succeeds

## 2) Retry-chain smoke

```bash
# minimal (ingest only)
npm run smoke:retry

# full e2e (requires admin session cookie)
ADMIN_SESSION_COOKIE=<cookie> npm run smoke:retry
```

Expected:
- failed event ingest returns 200
- retry endpoint returns 200 when cookie is provided
- run linkage visible in trace (`retriedFromRunId` / `retryRunId`)

## 3) Deploy + health

```bash
systemctl restart omniscience-dashboard
curl -I https://omniscience.rainhoole.com/login
curl https://omniscience.rainhoole.com/api/system/health
```

Expected:
- login 200
- health API 200 with valid JSON

## 4) Ops visibility

```bash
cd /opt/omniscience-dashboard
./scripts/ops-log.sh git_push "release <tag> deployed" success
```

Expected:
- `recentOps` contains latest release action
- dashboard shows operator timeline update

## 5) Documentation check

- README quick start commands are accurate
- new env vars documented in `.env.example`
- release notes mention breaking changes and migration impact
