#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

BASE_URL="${OMNISCIENCE_BASE_URL:-http://localhost:3200}"
ENV_FILE="${ENV_FILE:-.env}"

ok() { echo "✅ $*"; }
warn() { echo "⚠️  $*"; }
fail() { echo "❌ $*"; exit 1; }

check_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "missing command: $1"
}

check_http() {
  local path="$1"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}${path}" || true)
  if [[ "$code" =~ ^2|3|401$ ]]; then
    ok "${path} reachable (HTTP ${code})"
  else
    fail "${path} check failed at ${BASE_URL} (HTTP ${code})"
  fi
}

echo "== Omniscience Bootstrap Verification =="
echo "Root: ${ROOT_DIR}"
echo "Base URL: ${BASE_URL}"

check_cmd curl
check_cmd grep

[[ -f "$ENV_FILE" ]] || fail "${ENV_FILE} not found. Run: cp .env.example .env"
ok "${ENV_FILE} exists"

required_keys=(DATABASE_URL API_SECRET ADMIN_PASSWORD OPENCLAW_ADAPTER_TOKEN)
for key in "${required_keys[@]}"; do
  if grep -q "^${key}=." "$ENV_FILE"; then
    ok "env key present: ${key}"
  else
    fail "missing env key: ${key} in ${ENV_FILE}"
  fi
done

if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  if docker compose ps app >/dev/null 2>&1; then
    status=$(docker compose ps app --format json 2>/dev/null | tr -d '\n' || true)
    if [[ -n "$status" && "$status" == *"running"* ]]; then
      ok "docker compose app service is running"
    else
      warn "docker compose app service not running (run: make up)"
    fi
  fi
fi

check_http "/login"
check_http "/api/system/health"

echo
ok "bootstrap verification passed"
