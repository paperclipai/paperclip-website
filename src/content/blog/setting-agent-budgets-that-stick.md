---
title: "Setting agent budgets and making them stick"
date: "2026-04-27"
draft: true
excerpt: "How to run agents without waking up to a $12,000 model bill: per-agent caps, the 80% inflection point, approval gates, and the auto-pause of last resort."
author: "Paperclip"
tags: ["pattern", "budgets", "operations", "spend"]
---

Call it the $12,000 Anthropic bill. The exact vendor and amount are hypothetical; the failure mode is not.

It usually starts smaller. A coding agent mentions a coordinating agent. The coordinator replies. The coder replies again. Neither is obviously broken, but both are waking, reading context, writing acknowledgement comments, and spending tokens. Leave that loop alone for a weekend and Monday's bill is no longer a rounding error.

A budget that only lives in a dashboard is not a budget. To bind spend, it has to bite in four places: the agent sees the cap, behavior changes before the cap, expensive actions require approval, and the platform enforces the ceiling anyway.

## Layer 1: per-agent monthly caps

Every Paperclip agent has a monthly cap on the agent record:

```bash
curl -X PATCH "$PAPERCLIP_API_URL/api/agents/$AGENT_ID" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"budgetMonthlyCents": 5000}'
```

That is a $50 monthly cap for one agent. The same record exposes current spend, so the agent can read its own budget state at the start of every heartbeat:

```json
GET /api/agents/me
{
  "id": "c9dcefd1-...",
  "name": "DevRel",
  "budgetMonthlyCents": 5000,
  "spentMonthlyCents": 3850
}
```

That agent is at 77% of budget. It should know that before it accepts a speculative rewrite, starts a long research run, or mentions three other agents.

## Layer 2: the 80% inflection point

We use 80% as the line where behavior changes. It is not magic. It is enough headroom to finish real work without taking on ambitious new work.

Put the rule in the agent's standing instructions:

```text
On every heartbeat:
- Read budgetMonthlyCents and spentMonthlyCents from /api/agents/me.
- If spent >= 80% of cap, only pick up issues with priority="critical".
- If spent >= 95%, post a status comment to your manager and exit.
```

This layer matters more than the hard stop. By 100%, the agent is already paused. At 80%, it can still make intelligent tradeoffs: finish the production incident, skip the nice-to-have benchmark sweep, and stop waking other agents unless there is a real handoff.

## Layer 3: approval gates for expensive moves

Some decisions should not be made by one agent on one wake. Raise the cap. Hire another agent. Run a six-hour migration. Switch a subscription-backed workflow onto metered API. Those route through the board.

The pattern is `request_board_approval`:

```bash
curl -X POST "$PAPERCLIP_API_URL/api/companies/$COMPANY_ID/approvals" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "request_board_approval",
    "requestedByAgentId": "'"$AGENT_ID"'",
    "issueIds": ["'"$ISSUE_ID"'"],
    "payload": {
      "title": "Raise DevRel cap to $100/month",
      "summary": "Hit 90% mid-month. Three launch drafts are queued.",
      "recommendedAction": "Approve a temporary raise from $50 to $100.",
      "risks": ["Cap must be reset after this cycle if the workload is temporary."]
    }
  }'
```

The approval lands on the board user's dashboard. Approve or deny, the agent wakes with `PAPERCLIP_APPROVAL_ID` and acts on the answer. The work does not move until the authority boundary moves first.

## Layer 4: auto-pause

At 100%, Paperclip auto-pauses the agent. Heartbeats still fire so the system keeps an audit trail, but no new work is accepted:

```text
[heartbeat] agent=devrel run=8b26d7e5-...
  budget: spent=$50.18 / cap=$50.00 (100.4%)
  decision: paused - no new work accepted
```

We covered this from the debugging angle in [Debugging a stuck heartbeat](/blog/debugging-stuck-heartbeat/). The important part here is that auto-pause is the last resort. If an agent hits it every month, the upstream controls are wrong.

## A real month, not a fake pie chart

For an internal Paperclip company, the April 2026-to-date cost query looked like this:

```bash
curl "$PAPERCLIP_API_URL/api/companies/$COMPANY_ID/costs/by-agent?from=2026-04-01T00:00:00.000Z&to=2026-05-01T00:00:00.000Z" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY"
```

The metered API bill was only $1.05 because most of that company was running through subscription-included adapters. The useful budget signal was the wake shape:

| agent              | subscription wakes |
| ------------------ | ------------------ |
| QA                 | 322                |
| ClaudeCoder        | 301                |
| CTO                | 218                |
| UXDesigner         | 94                 |
| DevRel             | 58                 |

That is the part to watch. If the QA and coder traffic moves from subscription-included to metered Anthropic, those two rows become the bill. If a mention loop starts, this table is where it shows up before finance sees it.

The companion example repo encodes the same shape: one CEO, one coder, a $50 cap, an 80% triage rule, an approval request for cap raises, and a test that proves the agent stops accepting non-critical work near the limit. It lives at [paperclipai/paperclip-website/examples/budget-patterns](https://github.com/paperclipai/paperclip-website/tree/master/examples/budget-patterns) — the verification script there runs in pure bash and asserts the rule on ten cases, including the headline `spent=$42.50, priority=medium → defer`.

With all four layers in place, the worst case stops being a surprise invoice and starts being a visible operational event: the agent paused, the manager got the status, and the next action is obvious.

Tested against Paperclip v0.3.0.
