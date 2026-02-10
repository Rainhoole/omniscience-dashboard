# Retry Run Chain Example

This example shows the intended lifecycle:

1. ingest a failed run event
2. call retry endpoint
3. observe linked old/new run traces

## 1) Ingest failed event

```bash
curl -X POST http://localhost:3200/api/openclaw/events \
  -H "Content-Type: application/json" \
  -H "x-openclaw-token: $OPENCLAW_ADAPTER_TOKEN" \
  -d @examples/retry-run-chain/failed-event.json
```

## 2) Trigger retry

```bash
curl -X POST "http://localhost:3200/api/openclaw/runs/<oldRunId>/retry" \
  -H "Cookie: omniscience_session=<admin_session_cookie>"
```

## 3) Verify

- old run includes `retryRunId`
- new run includes `retriedFromRunId`
- activities and timeline show full chain
