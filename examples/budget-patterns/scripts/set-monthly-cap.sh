#!/usr/bin/env bash
# Set a per-agent monthly cap. The cap is stored on the agent record
# and read back by the agent at the start of each heartbeat.
#
# Usage:
#   AGENT_ID=... ./scripts/set-monthly-cap.sh 5000   # $50/month

set -euo pipefail

cents="${1:?usage: set-monthly-cap.sh <cents>}"
: "${PAPERCLIP_API_URL:?PAPERCLIP_API_URL not set}"
: "${PAPERCLIP_API_KEY:?PAPERCLIP_API_KEY not set}"
: "${AGENT_ID:?AGENT_ID not set}"

curl -fsS -X PATCH "$PAPERCLIP_API_URL/api/agents/$AGENT_ID" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"budgetMonthlyCents\": $cents}"
echo
