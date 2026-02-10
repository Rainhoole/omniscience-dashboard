#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

BASE_URL="${OMNISCIENCE_BASE_URL:-http://localhost:3200}"
TOKEN="${OPENCLAW_ADAPTER_TOKEN:-}"
COOKIE="${ADMIN_SESSION_COOKIE:-}"
TASK_ID="${SMOKE_TASK_ID:-00000000-0000-0000-0000-000000000000}"
RUN_ID="smoke_retry_$(date +%s)"

if [[ -z "$TOKEN" && -f .env ]]; then
  TOKEN=$(grep '^OPENCLAW_ADAPTER_TOKEN=' .env | cut -d= -f2- || true)
fi

if [[ -z "$TOKEN" ]]; then
  echo "❌ OPENCLAW_ADAPTER_TOKEN missing (env or .env)"
  exit 1
fi

echo "== Retry chain smoke =="
echo "Base: $BASE_URL"
echo "Run:  $RUN_ID"

payload=$(cat <<JSON
{"type":"task.failed","runId":"$RUN_ID","taskId":"$TASK_ID","agentId":"main","description":"retry smoke failed event","metadata":{"source":"smoke"}}
JSON
)

code=$(curl -sS -o /tmp/retry-smoke-event.json -w "%{http_code}" \
  -X POST "$BASE_URL/api/openclaw/events" \
  -H "Content-Type: application/json" \
  -H "x-openclaw-token: $TOKEN" \
  --data "$payload")

if [[ "$code" != "200" && "$code" != "201" ]]; then
  echo "❌ ingest failed: HTTP $code"
  cat /tmp/retry-smoke-event.json
  exit 1
fi

echo "✅ failed event ingested"

if [[ -z "$COOKIE" ]]; then
  echo "⚠️ ADMIN_SESSION_COOKIE missing, retry dispatch step skipped"
  echo "Set ADMIN_SESSION_COOKIE to test /retry endpoint end-to-end"
  exit 0
fi

code=$(curl -sS -o /tmp/retry-smoke-retry.json -w "%{http_code}" \
  -X POST "$BASE_URL/api/openclaw/runs/$RUN_ID/retry" \
  -H "Cookie: omniscience_session=$COOKIE")

if [[ "$code" != "200" ]]; then
  echo "❌ retry call failed: HTTP $code"
  cat /tmp/retry-smoke-retry.json
  exit 1
fi

echo "✅ retry endpoint returned 200"
cat /tmp/retry-smoke-retry.json
