#!/usr/bin/env bash
# Verification fixture for the budget triage rule.
#
# Runs scripts/triage.sh against a small table of (budget, spend, priority)
# cases and asserts the decision matches the expected outcome — most
# importantly: NON-CRITICAL WORK IS REFUSED NEAR THE CAP.
#
# This is a pure-bash test; no API calls.
#
# Usage:
#   ./scripts/verify.sh

set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
triage="$here/triage.sh"

if [ ! -x "$triage" ]; then
  chmod +x "$triage"
fi

# spent | budget | priority | expected
cases=(
  "1500 5000 medium   accept"   # 30%, plenty of headroom
  "1500 5000 critical accept"   # 30%, also fine
  "3950 5000 medium   accept"   # 79%, just under the line
  "4000 5000 medium   defer"    # 80%, the inflection — non-critical refused
  "4250 5000 medium   defer"    # 85%, the headline case from the blog
  "4250 5000 critical accept"   # 85%, critical still goes through
  "4750 5000 high     escalate" # 95%, escalate to manager
  "4750 5000 critical accept"   # 95%, critical still goes through
  "5000 5000 critical paused"   # 100%, hard stop
  "5100 5000 critical paused"   # over cap, hard stop
)

pass=0
fail=0
fail_lines=()

for row in "${cases[@]}"; do
  read -r spent budget priority expected <<<"$row"
  got=$(BUDGET_CENTS="$budget" SPENT_CENTS="$spent" PRIORITY="$priority" "$triage")
  if [ "$got" = "$expected" ]; then
    pass=$(( pass + 1 ))
    printf "  ok   spent=%4s budget=%4s priority=%-8s -> %s\n" "$spent" "$budget" "$priority" "$got"
  else
    fail=$(( fail + 1 ))
    printf "  FAIL spent=%4s budget=%4s priority=%-8s -> %s (expected %s)\n" \
      "$spent" "$budget" "$priority" "$got" "$expected"
    fail_lines+=("spent=$spent budget=$budget priority=$priority got=$got want=$expected")
  fi
done

echo
echo "results: $pass passed, $fail failed"

if [ "$fail" -ne 0 ]; then
  echo
  echo "failures:"
  for line in "${fail_lines[@]}"; do
    echo "  $line"
  done
  exit 1
fi
