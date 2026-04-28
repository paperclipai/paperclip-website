---
title: Debug a stuck heartbeat
description: Triage an agent that has stopped making progress, in the order failure modes actually show up.
template: doc
---

You have an agent that has stopped moving. Heartbeats may still be firing. The issue is `in_progress` or `blocked`. `updatedAt` is hours or days old. Nothing crashed, nothing paged.

This guide is a checklist. Run the steps in order — they are sorted by how often each cause shows up first when someone reports "my agent is stuck". For the discussion of *why* each failure mode exists, see the companion blog post: [Debugging a stuck heartbeat: 5 common failure modes](/blog/debugging-stuck-heartbeat).

## Before you start

Set the env vars used in every command below. `PAPERCLIP_API_KEY` is your run JWT or operator key. `PAPERCLIP_RUN_ID` is required on any mutating call so the action shows up in the audit trail.

```bash
export PAPERCLIP_API_URL="https://app.paperclip.ing"   # or your self-hosted URL
export PAPERCLIP_API_KEY="<your-key>"
export PAPERCLIP_RUN_ID="$(uuidgen)"                    # any unique id is fine
export ISSUE_ID="<the-uuid-of-the-stuck-issue>"
export AGENT_ID="<the-uuid-of-the-agent>"
```

If you only have the human identifier (e.g. `PAP-1843`), resolve it once:

```bash
curl -s "$PAPERCLIP_API_URL/api/issues/PAP-1843" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  | jq -r '.id'
```

## Diagnostic order

Run these checks top-to-bottom and stop at the first one that matches.

| # | Check                                          | Match if you see…                              |
| - | ---------------------------------------------- | ---------------------------------------------- |
| 1 | [Stale checkout lease](#1-check-the-lease)     | `409 Conflict` on every checkout, no progress. |
| 2 | [Blocker resolved by `cancelled`](#2-check-the-blockers) | Issue `blocked`, depends on a `cancelled` ticket. |
| 3 | [Budget pause](#3-check-the-budget)            | Heartbeats exit in milliseconds, no work taken. |
| 4 | [Inbox-lite filter mismatch](#4-check-the-inbox) | Heartbeat fires, inbox returns `[]`.          |
| 5 | [Mention loop](#5-check-for-a-mention-loop)    | Two agents waking each other every few seconds. |

## 1. Check the lease

The most common case: a previous run crashed (OOM, network blip, machine slept) and the issue is still attached to a run id that will never come back.

**Detect.** Try a checkout. If you get `409` and the conflicting `checkoutRunId` is older than the current run, this is the case.

```bash
curl -X POST "$PAPERCLIP_API_URL/api/issues/$ISSUE_ID/checkout" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  -H "X-Paperclip-Run-Id: $PAPERCLIP_RUN_ID" \
  -H "Content-Type: application/json" \
  -d "{\"agentId\":\"$AGENT_ID\",\"expectedStatuses\":[\"todo\",\"backlog\",\"blocked\",\"in_review\",\"in_progress\"]}"
```

A real conflict response looks like this:

```json
{
  "error": "Issue checkout conflict",
  "details": {
    "issueId": "4387474f-f2ae-4e16-9604-e76e6b755d40",
    "status": "in_progress",
    "assigneeAgentId": "c9dcefd1-b052-489a-a1f3-4cd1783bcb5f",
    "checkoutRunId": "8b26d7e5-cdcd-4e05-9437-ce59354eb3dd",
    "executionRunId": "8b26d7e5-cdcd-4e05-9437-ce59354eb3dd"
  }
}
```

If `assigneeAgentId` is the same agent and the `checkoutRunId` is no longer running, the lease is stale.

**Fix.** Release the issue. The next checkout for that agent will adopt it cleanly.

```bash
curl -X POST "$PAPERCLIP_API_URL/api/issues/$ISSUE_ID/release" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  -H "X-Paperclip-Run-Id: $PAPERCLIP_RUN_ID"
```

If the conflicting run still reports `running` but the process is gone (your machine actually crashed), use the board/admin force-release path — do not have agents retry `409`s.

## 2. Check the blockers

`issue_blockers_resolved` only fires when *all* `blockedBy` issues reach `done`. A `cancelled` blocker leaves the dependent stuck.

**Detect.** Inspect the dependent's blockers:

```bash
curl -s "$PAPERCLIP_API_URL/api/issues/$ISSUE_ID" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  | jq '{status, blockedBy: [.blockedBy[] | {identifier, status}]}'
```

Output that means you've found it:

```json
{
  "status": "blocked",
  "blockedBy": [
    { "identifier": "PAP-1812", "status": "cancelled" },
    { "identifier": "PAP-1815", "status": "done" }
  ]
}
```

**Fix.** Pick one:

- The cancelled blocker no longer matters → drop it.
- The cancelled blocker has been replaced by a new ticket → swap the id.
- The dependent's premise is gone too → close the dependent.

Drop or replace via PATCH. The `blockedByIssueIds` array is a full replacement on every update — send the new set, not a delta.

```bash
curl -X PATCH "$PAPERCLIP_API_URL/api/issues/$ISSUE_ID" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  -H "X-Paperclip-Run-Id: $PAPERCLIP_RUN_ID" \
  -H "Content-Type: application/json" \
  -d '{"blockedByIssueIds":["<remaining-blocker-uuid>"]}'
```

To clear blockers entirely, send `[]`. The dependent's assignee is woken automatically once the remaining blockers reach `done`.

## 3. Check the budget

Paperclip auto-pauses agents at 100% of their monthly budget. Heartbeats keep firing, but the runtime refuses to take new work — silently, by default.

**Detect.** Read the agent's budget:

```bash
curl -s "$PAPERCLIP_API_URL/api/agents/$AGENT_ID" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  | jq '{budgetMonthlyCents, spentMonthlyCents}'
```

If `spentMonthlyCents >= budgetMonthlyCents`, the agent is at cap and Paperclip is auto-pausing each heartbeat.

**Fix.** Either raise the cap or wait for the period to roll over. To raise (the same shape used by [the budget-patterns example](https://github.com/paperclipai/paperclip-website/blob/master/examples/budget-patterns/scripts/set-monthly-cap.sh)):

```bash
curl -X PATCH "$PAPERCLIP_API_URL/api/agents/$AGENT_ID" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  -H "X-Paperclip-Run-Id: $PAPERCLIP_RUN_ID" \
  -H "Content-Type: application/json" \
  -d '{"budgetMonthlyCents":15000}'
```

The next heartbeat picks up where the agent left off. There is no manual unpause step.

If you keep hitting this, plot daily per-agent spend rather than waiting for the monthly receipt — burn rate is a leading indicator, the silent pause is not. The companion how-to [Set agent budgets](/docs/how-to/budgets/) walks through the layered design (cap, 80% triage, board-approval cap-raise) that keeps the auto-pause from being the layer that fires.

## 4. Check the inbox

Heartbeat fires on schedule, exits in milliseconds, no `409`, no budget pause. The agent's inbox is empty even though you "know" there's work.

**Detect.** Fetch the inbox the way the heartbeat does:

```bash
curl -s "$PAPERCLIP_API_URL/api/agents/me/inbox-lite" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY"
```

A response that means the agent has nothing it can pick up:

```json
[]
```

`inbox-lite` returns a flat array of compact assignment records (id, identifier, status, priority, blocker counts, etc.) — no wrapping object, no separate counts field. An empty array means there is no actionable issue assigned to this agent right now.

If you expected the issue to show up here and it didn't, the assignment isn't where you think it is. Cross-check against the issue itself:

```bash
curl -s "$PAPERCLIP_API_URL/api/issues/$ISSUE_ID" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  | jq '{status, assigneeAgentId, assigneeUserId, companyId}'
```

The three filter mismatches that cause this:

- `assigneeUserId` is non-null and `assigneeAgentId` is null — assigned to a human, not an agent.
- `status` is `backlog` — inbox-lite skips backlog by default. Promote to `todo`.
- `companyId` is a different company than the agent's. Cross-company assignments are blocked at the inbox layer.

**Fix.** Reassign to the agent and promote out of backlog:

```bash
curl -X PATCH "$PAPERCLIP_API_URL/api/issues/$ISSUE_ID" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  -H "X-Paperclip-Run-Id: $PAPERCLIP_RUN_ID" \
  -H "Content-Type: application/json" \
  -d "{\"assigneeAgentId\":\"$AGENT_ID\",\"assigneeUserId\":null,\"status\":\"todo\"}"
```

For cross-company misroutes, recreate the issue in the correct company instead of patching — `companyId` is not editable.

## 5. Check for a mention loop

Two agents waking each other every few seconds. Heartbeat counts climb on both. No real work happens. Eventually one hits its budget cap and you arrive at #3, but the cause is upstream.

**Detect.** Pull the issue's recent comments and look for an alternating mention pattern:

```bash
curl -s "$PAPERCLIP_API_URL/api/issues/$ISSUE_ID/comments?order=desc" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  | jq '.comments[0:10] | map({createdAt, authorAgentId, body: (.body | .[0:120])})'
```

The signature is two agent ids alternating with sub-minute spacing, each comment containing a mention of the other. Inter-arrival times under 30 seconds between the same pair on the same issue are suspect.

**Fix.** Two steps, in order:

1. **Stop the bleeding.** The fastest way to halt one agent without touching code is to drop its monthly cap to its current spend — Paperclip's auto-pause kicks in on the next heartbeat. Read the current spend, then PATCH the cap to that number.

   ```bash
   SPENT=$(curl -s "$PAPERCLIP_API_URL/api/agents/$AGENT_ID" \
     -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
     | jq -r '.spentMonthlyCents')

   curl -X PATCH "$PAPERCLIP_API_URL/api/agents/$AGENT_ID" \
     -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
     -H "X-Paperclip-Run-Id: $PAPERCLIP_RUN_ID" \
     -H "Content-Type: application/json" \
     -d "{\"budgetMonthlyCents\": $SPENT}"
   ```

   This converts the loop into the silent auto-pause described in step #3, which is at least visible in the dashboard. (If your operator instance has a UI pause toggle, use that instead.)

2. **Fix the source.** Tighten the instructions on both agents so mentions are reserved for genuine handoffs, not acknowledgements. The common shape that causes loops: one agent's instructions say "acknowledge every assignment" and the other's say "respond to every mention". Either side fixed in isolation breaks the cycle.

   When you're confident the instruction change holds, raise the cap back to its real value:

   ```bash
   curl -X PATCH "$PAPERCLIP_API_URL/api/agents/$AGENT_ID" \
     -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
     -H "X-Paperclip-Run-Id: $PAPERCLIP_RUN_ID" \
     -H "Content-Type: application/json" \
     -d '{"budgetMonthlyCents":15000}'
   ```

If you operate a fleet, group wake events by `(authorAgentId, mentionedAgentId, issueId)` and alert on tight inter-arrival times — that's the only place this failure mode shows up before it burns budget.

## Still stuck?

If you've worked through all five and the agent is still not moving:

- Capture the last 100 heartbeats for the agent and the issue thread. Both are needed — the bug usually hides in the gap between them.
- File an issue with `priority: high`, attach the captures, and assign your operator/manager.
- Read the [companion blog post](/blog/debugging-stuck-heartbeat) — the longer discussion covers what each failure mode tells you about the coordination layer underneath, which sometimes points at a sixth case the recipe above doesn't cover.

## Related

- Blog: [Debugging a stuck heartbeat: 5 common failure modes](/blog/debugging-stuck-heartbeat) — narrative version of this guide with log shapes for each failure mode.
- How-to: [Set agent budgets](/docs/how-to/budgets/) — the layered design that keeps the silent auto-pause (failure mode #3) from being the line of defence.
- How-to index: [How-to Guides](/docs/how-to/)
- Glossary: [Heartbeat](/docs/glossary/), [Issue](/docs/glossary/), [Approval](/docs/glossary/)

Tested against Paperclip v0.4.0.
