#!/bin/bash
# Usage: ./scripts/db-query.sh "select * from profiles limit 5"
#
# Requires in .env.local:
#   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
#   SUPABASE_ACCESS_TOKEN=sbp_...   (from supabase.com/dashboard/account/tokens)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env.local"

if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  set -a; source "$ENV_FILE"; set +a
fi

if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "Error: SUPABASE_ACCESS_TOKEN is not set. Add it to .env.local." >&2
  exit 1
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  echo "Error: NEXT_PUBLIC_SUPABASE_URL is not set. Add it to .env.local." >&2
  exit 1
fi

PROJECT_REF="${NEXT_PUBLIC_SUPABASE_URL#https://}"
PROJECT_REF="${PROJECT_REF%.supabase.co}"

QUERY="${1:-select now()}"
curl -s "https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query" \
  -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -X POST \
  -d "{\"query\": $(echo "$QUERY" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')}" \
  | python3 -m json.tool 2>/dev/null || echo "No results or error"
