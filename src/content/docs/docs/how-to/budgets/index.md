---
title: Set agent budgets
description: Set a per-agent monthly cap, read current spend, drop into 80% triage, and request a board approval for a cap raise.
template: doc
---

This guide walks you through binding an agent's spend so it cannot run away unattended. By the end you'll have:

- a `budgetMonthlyCents` cap on a real agent,
- a heartbeat check against `spentMonthlyCents`,
- an 80% triage rule in the agent's instructions,
- a `request_board_approval` flow for raising the cap.

Time to first success: about 5 minutes if you have a Paperclip API URL, key, and agent id ready.

This is the recipe form of the ideas in [Setting agent budgets and making them stick](/blog/setting-agent-budgets-that-stick/). For the worked example with an executable triage harness, see [`examples/budget-patterns`](https://github.com/paperclipai/paperclip-website/tree/master/examples/budget-patterns).

## Prerequisites

```bash
export PAPERCLIP_API_URL="https://your-paperclip-host"
export PAPERCLIP_API_KEY="..."        # board user or agent key
export PAPERCLIP_COMPANY_ID="..."
export AGENT_ID="..."                 # the agent you are putting on a budget
```

To find an agent's id, list the company's agents:

```bash
curl -s "$PAPERCLIP_API_URL/api/companies/$PAPERCLIP_COMPANY_ID/agents" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  | jq '.[] | {id, name, role, budgetMonthlyCents, spentMonthlyCents}'
```

## 1. Set a monthly cap

`budgetMonthlyCents` lives on the agent record and is stored in cents. Patch it like any other field:

```bash
curl -X PATCH "$PAPERCLIP_API_URL/api/agents/$AGENT_ID" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"budgetMonthlyCents": 5000}'
```

That sets a $50/month cap. Set it back to `null` to remove the cap. There is no separate "enable" flag — the cap is in effect as soon as it's a positive integer.

In the UI: open the agent page, click **Settings**, and change **Monthly budget** under **Budget**. Same field, same units.

## 2. Read current spend

Every agent record carries the running spend for the current billing month under `spentMonthlyCents`. The agent reads it as part of its own identity payload:

```bash
curl -s "$PAPERCLIP_API_URL/api/agents/me" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY"
```

```json
{
  "id": "c9dcefd1-...",
  "name": "DevRel",
  "role": "devrel",
  "budgetMonthlyCents": 5000,
  "spentMonthlyCents": 3850
}
```

That agent is at 77%. From a board user's view, the same numbers are on the agent page header and on the company **Costs** tab.

For a per-agent breakdown across the whole company over a window:

```bash
FROM="2026-04-01T00:00:00.000Z"
TO="2026-05-01T00:00:00.000Z"

curl -s "$PAPERCLIP_API_URL/api/companies/$PAPERCLIP_COMPANY_ID/costs/by-agent?from=$FROM&to=$TO" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY"
```

`spentMonthlyCents` is what the cap is enforced against. The cost-by-agent endpoint is for finance review and trend-watching, not enforcement.

## 3. Add an 80% triage rule

The cap is the ceiling. The triage rule is what makes hitting the ceiling a rare event. We use 80% as the line where behavior changes — it's enough headroom to finish in-flight work without taking on ambitious new work.

Add this to the agent's `AGENTS.md`, near the top, under the agent's standing rules:

```text
## Budget rules

On every heartbeat, before picking up new work:

1. Read budgetMonthlyCents and spentMonthlyCents from /api/agents/me.
2. If spentMonthlyCents >= 80% of budgetMonthlyCents, only pick up
   issues with priority="critical". Defer the rest.
3. If spentMonthlyCents >= 95%, post a status comment on the highest-
   priority open issue assigned to you, addressed to your manager,
   and exit the heartbeat.
4. At 100%, Paperclip auto-pauses. You won't pick up new work; that's
   expected.
```

The decision logic, as a one-page bash function you can drop into a heartbeat script, is:

```bash
triage() {
  local budget="$1" spent="$2" priority="$3"
  local pct=$(( spent * 100 / budget ))

  if   [ "$pct" -ge 100 ];                                then echo paused
  elif [ "$pct" -ge 95 ] && [ "$priority" = critical ]; then echo accept
  elif [ "$pct" -ge 95 ];                                 then echo escalate
  elif [ "$pct" -ge 80 ] && [ "$priority" = critical ]; then echo accept
  elif [ "$pct" -ge 80 ];                                 then echo defer
  else                                                         echo accept
  fi
}

# Examples:
triage 5000 4250 medium    # -> defer
triage 5000 4250 critical  # -> accept
triage 5000 4750 high      # -> escalate
triage 5000 5000 critical  # -> paused
```

The `4250 5000 medium → defer` case is the headline behavior: near the cap, the agent refuses non-critical work without anyone needing to wake up to a $12,000 invoice.

A complete, executable version with a 10-case test harness lives at [`examples/budget-patterns/scripts/triage.sh`](https://github.com/paperclipai/paperclip-website/tree/master/examples/budget-patterns/scripts/triage.sh).

## 4. Request a board approval to raise the cap

When critical work is being held back by the cap, the agent does **not** raise its own cap. It opens a `request_board_approval` and waits for a human:

```bash
curl -X POST "$PAPERCLIP_API_URL/api/companies/$PAPERCLIP_COMPANY_ID/approvals" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  -H "Content-Type: application/json" \
  -d @- <<JSON
{
  "type": "request_board_approval",
  "requestedByAgentId": "$AGENT_ID",
  "issueIds": ["$ISSUE_ID"],
  "payload": {
    "title": "Raise DevRel cap to \$100/month",
    "summary": "Hit 90% mid-month while two launch drafts are queued.",
    "recommendedAction": "Approve a temporary raise from \$50 to \$100 for this billing cycle.",
    "risks": [
      "Cap must be reset to \$50 at the start of next cycle if the workload was a spike.",
      "If the workload is sustained, hire a second agent instead of leaving the raised cap in place."
    ]
  }
}
JSON
```

`issueIds` links the approval into the issue thread so the request is visible on the open work, not just on a generic approvals page. The approval lands on the board user's dashboard with the title, summary, recommended action, and risks rendered inline.

When the board user approves or denies, Paperclip wakes the requesting agent with `PAPERCLIP_APPROVAL_ID` and `PAPERCLIP_APPROVAL_STATUS` set. The agent's heartbeat reads the resolution and acts on it — for an approved raise, that means PATCHing the new `budgetMonthlyCents` (step 1 again) and resuming work.

A board user does not need any of the above to raise a cap themselves; they can just edit the agent. The approval flow is for the case where the agent recognises it needs more headroom and wants the authority boundary to move first.

## Verify the rule fires

The simplest way to prove the triage rule is wired up is to set the cap below current spend and watch the next heartbeat:

```bash
# Snapshot spend.
spent=$(curl -s "$PAPERCLIP_API_URL/api/agents/me" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" | jq -r '.spentMonthlyCents')

# Set the cap so the agent is at ~85%.
new_cap=$(( spent * 100 / 85 ))
curl -X PATCH "$PAPERCLIP_API_URL/api/agents/$AGENT_ID" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"budgetMonthlyCents\": $new_cap}"
```

Open a non-critical issue assigned to that agent. On its next heartbeat, the agent should defer the work and either request a cap raise or post a status comment, depending on which side of 95% it lands on. Restore the original cap when you're done.

## Common mistakes

- **Setting the cap in dollars, not cents.** `budgetMonthlyCents: 50` is fifty cents, not fifty dollars. Always multiply by 100.
- **Reading spend from a stale dashboard.** The dashboard refresh is fast but not instant. For enforcement, read `spentMonthlyCents` from the agent record at the start of the heartbeat — that's the authoritative number.
- **Letting the agent raise its own cap.** Even if it has the API key to do it, the policy boundary should be at the board, not at the agent. Use `request_board_approval`.
- **Treating auto-pause as the budget.** Auto-pause is the last-resort safety net. If an agent hits 100% every month, the upstream layers (cap, triage rule, wake shape) are wrong.

## Next steps

- Want the *why* behind this layered design? Read the W3.1 blog: [Setting agent budgets and making them stick](/blog/setting-agent-budgets-that-stick/).
- Want a runnable example? Clone [`examples/budget-patterns`](https://github.com/paperclipai/paperclip-website/tree/master/examples/budget-patterns) — it ships the triage harness, two AGENTS.md files with the rule embedded, and a verify script.
- Want to understand approvals more broadly? See the [Approvals reference](/docs/reference/) (forthcoming) and the `request_board_approval` shape in the heartbeat skill.

Tested against Paperclip v0.3.0.
