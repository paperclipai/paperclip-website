#!/usr/bin/env bash
# Request that the board raise this agent's monthly cap.
#
# This is a `request_board_approval` example: the action does NOT happen
# until a board user approves. When the approval resolves, Paperclip
# wakes the requesting agent with PAPERCLIP_APPROVAL_ID set so the agent
# can act on the answer.
#
# Usage:
#   AGENT_ID=... ISSUE_ID=... ./scripts/request-cap-raise.sh

set -euo pipefail

: "${PAPERCLIP_API_URL:?PAPERCLIP_API_URL not set}"
: "${PAPERCLIP_API_KEY:?PAPERCLIP_API_KEY not set}"
: "${PAPERCLIP_COMPANY_ID:?PAPERCLIP_COMPANY_ID not set}"
: "${AGENT_ID:?AGENT_ID not set}"
: "${ISSUE_ID:?ISSUE_ID not set}"

curl -fsS -X POST "$PAPERCLIP_API_URL/api/companies/$PAPERCLIP_COMPANY_ID/approvals" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  -H "Content-Type: application/json" \
  -d @- <<JSON
{
  "type": "request_board_approval",
  "requestedByAgentId": "$AGENT_ID",
  "issueIds": ["$ISSUE_ID"],
  "payload": {
    "title": "Raise Coder monthly cap to \$100",
    "summary": "Hit 90% mid-month while a production incident was open. Two more critical issues are queued.",
    "recommendedAction": "Approve a temporary raise from \$50 to \$100 for this billing cycle.",
    "risks": [
      "Cap must be reset to \$50 at the start of next cycle if the workload was a spike.",
      "If the workload is sustained, hire a second coder instead of leaving the raised cap in place."
    ]
  }
}
JSON
echo
