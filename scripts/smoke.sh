#!/usr/bin/env bash
# Smoke test for the Root Cause API. Run it before cutting a release and again
# after a deploy; it catches the failure classes we have actually hit (API down
# on a bad migration, a challenge seeded with an empty image, a broken auth gate,
# an empty catalog).
#
# Usage:
#   scripts/smoke.sh [API_BASE]
# Default API_BASE: https://root-cause-api.matejbasic.com (override with the arg
# or the SMOKE_API env var, e.g. to point at a local instance).
#
# Exit code 0 = all checks passed, non-zero = at least one failed.

set -u
API="${1:-${SMOKE_API:-https://root-cause-api.matejbasic.com}}"
fail=0
pass() { printf 'PASS  %s\n' "$1"; }
bad()  { printf 'FAIL  %s\n' "$1"; fail=1; }

echo "smoke: $API"

# 1. Health endpoint is up.
h=$(curl -fsS -m 15 "$API/health" 2>/dev/null)
if printf '%s' "$h" | grep -q '"ok":true'; then
  pass "GET /health -> ok:true"
else
  bad "GET /health (got: ${h:-no response})"
fi

# 2. Catalog serves the expected challenges.
c=$(curl -fsS -m 15 "$API/challenges" 2>/dev/null)
if printf '%s' "$c" | grep -q '"slug":"zgrep-rce"'; then
  pass "GET /challenges includes a known challenge"
else
  bad "GET /challenges missing expected challenge"
fi

# 3. No active challenge has an empty image (guards the empty-image deploy regression).
if printf '%s' "$c" | grep -q '"image":""'; then
  bad "a challenge is served with an empty image"
else
  pass "every served challenge has an image"
fi

# 4. Deactivated challenges stay out of the catalog.
if printf '%s' "$c" | grep -qE '"slug":"(erms-sqli|dirty-pipe)"'; then
  bad "a deactivated challenge is in the catalog"
else
  pass "deactivated challenges are hidden"
fi

# 5. Flag issuance requires an API key (auth gate is enforced).
code=$(curl -s -m 15 -o /dev/null -w '%{http_code}' -X POST "$API/challenges/zgrep-rce/run")
if [ "$code" = "401" ]; then
  pass "POST /challenges/:slug/run without a key -> 401"
else
  bad "POST /run auth gate (got HTTP $code, want 401)"
fi

if [ "$fail" -eq 0 ]; then echo "SMOKE OK"; else echo "SMOKE FAILED"; fi
exit "$fail"
