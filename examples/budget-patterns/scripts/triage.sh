#!/usr/bin/env bash
# Decide whether an agent should accept an issue, given the agent's
# current budget state and the issue's priority. This is the executable
# form of the triage rule documented in agents/*/AGENTS.md.
#
# Inputs (env):
#   BUDGET_CENTS   monthly cap, e.g. 5000
#   SPENT_CENTS    spent so far this month, e.g. 4250
#   PRIORITY       one of: critical, high, medium, low
#
# Outputs (stdout):
#   accept           — pick up the issue
#   defer            — skip; non-critical near cap
#   escalate         — skip; near cap, post status to manager
#   paused           — at or over cap; do nothing
#
# Exit code is 0 when the decision was emitted cleanly.

set -euo pipefail

: "${BUDGET_CENTS:?BUDGET_CENTS not set}"
: "${SPENT_CENTS:?SPENT_CENTS not set}"
: "${PRIORITY:?PRIORITY not set}"

if [ "$BUDGET_CENTS" -le 0 ]; then
  echo "BUDGET_CENTS must be > 0" >&2
  exit 2
fi

# Integer percent, rounded down.
pct=$(( SPENT_CENTS * 100 / BUDGET_CENTS ))

if [ "$pct" -ge 100 ]; then
  echo paused
  exit 0
fi

if [ "$pct" -ge 95 ]; then
  if [ "$PRIORITY" = "critical" ]; then
    echo accept
  else
    echo escalate
  fi
  exit 0
fi

if [ "$pct" -ge 80 ]; then
  if [ "$PRIORITY" = "critical" ]; then
    echo accept
  else
    echo defer
  fi
  exit 0
fi

echo accept
