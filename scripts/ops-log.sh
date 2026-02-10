#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   scripts/ops-log.sh <action> <description> [status]
# Example:
#   scripts/ops-log.sh deploy "deployed commit abc123" success

ACTION="${1:-}"
DESC="${2:-}"
STATUS="${3:-info}"

if [[ -z "$ACTION" || -z "$DESC" ]]; then
  echo "Usage: $0 <action> <description> [status]" >&2
  exit 1
fi

BASE_URL="${OMNISCIENCE_BASE_URL:-https://omniscience.rainhoole.com}"
TOKEN="${OPENCLAW_ADAPTER_TOKEN:-}"

if [[ -z "$TOKEN" && -f .env ]]; then
  TOKEN=$(grep '^OPENCLAW_ADAPTER_TOKEN=' .env | cut -d= -f2- || true)
fi

if [[ -z "$TOKEN" ]]; then
  echo "OPENCLAW_ADAPTER_TOKEN not found (env or .env)" >&2
  exit 1
fi

curl -sS -X POST "${BASE_URL}/api/openclaw/ops" \
  -H "Content-Type: application/json" \
  -H "x-openclaw-token: ${TOKEN}" \
  --data "{\"action\":\"${ACTION}\",\"description\":\"${DESC//\"/\\\"}\",\"status\":\"${STATUS}\"}" >/dev/null

echo "[ok] logged ${ACTION}: ${DESC}"
