---
title: "Debugging a stuck heartbeat: 5 common failure modes"
date: "2026-04-27"
excerpt: "An agent that stops working at 4pm Friday and is still stopped Monday morning is almost always one of these five things. Symptom, root cause, fix, and the log line that tells you which one."
author: "Paperclip"
tags: ["debugging", "heartbeats", "operations"]
---

A stuck heartbeat rarely crashes. The agent doesn't throw, doesn't page anyone, doesn't leave a stack trace at the top of your inbox. It just stops moving. Issue sits in `in_progress`. `updatedAt` is yesterday. The dashboard shows green.

You only notice on Monday because the work didn't ship.

We've debugged enough of these — internally and on user instances — that the failure modes cluster tightly. Ranked by how often they show up first when someone DMs us "my agent stopped":

1. Stale lease from a crashed prior run
2. Blocker resolved by `cancelled`, not `done`
3. Budget cap hit, agent silently paused
4. Wake fires, no work picked up
5. Mention loop between two agents

For each: the symptom you'll see in the dashboard, the root cause, the fix, and the exact log line that tells you which one you're looking at.

## 1. Stale lease from a crashed prior run

**Symptom.** New heartbeats can't check out the issue, or they keep adopting the same issue without any user-visible progress. The agent appears to be running — heartbeat count climbs — but every wake exits within a second with no work done.

**Root cause.** A previous run crashed (process killed, OOM, network blip, machine slept) before releasing its checkout. The issue is still attached to a run id that will never come back. Paperclip adopts the lock when that old run is terminal or missing, but if the old run still looks active you get a real conflict.

**Log line that confirms it.**

```text
[heartbeat] POST /api/issues/PAP-1843/checkout
  → 409 Conflict
  body: {
    "error":"Issue checkout conflict",
    "details":{
      "issueId":"4387474f-f2ae-4e16-9604-e76e6b755d40",
      "status":"in_progress",
      "assigneeAgentId":"c9dcefd1-b052-489a-a1f3-4cd1783bcb5f",
      "checkoutRunId":"8b26d7e5-cdcd-4e05-9437-ce59354eb3dd",
      "executionRunId":"8b26d7e5-cdcd-4e05-9437-ce59354eb3dd"
    }
  }
```

If `checkoutRunId` is older than the current run id and the owning agent is *you*, check the old run. Terminal or missing runs should be adopted on the next checkout. A run that still reports `queued` or `running` is the stale-lock case.

**Fix.** If the old run is terminal or missing, let the next checkout adopt it or release the issue explicitly:

```bash
curl -X POST "$PAPERCLIP_API_URL/api/issues/$ISSUE_ID/release" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  -H "X-Paperclip-Run-Id: $PAPERCLIP_RUN_ID"
```

If the run still looks active but the process is gone, use the board/admin force-release path instead of teaching the agent to retry 409s.

**Observability.** The thing that makes this debuggable at all is that every checkout writes the run id. A "your agent is stuck" report becomes a one-line query: *show me checkouts where the owning run hasn't reported a heartbeat in the last N minutes*. Without persistent run identity, you'd be guessing.

## 2. Blocker resolved by `cancelled`, not `done`

**Symptom.** Issue sits in `blocked` forever. The thing it's waiting on is closed. Nothing wakes the dependent.

**Root cause.** Paperclip's `issue_blockers_resolved` wake fires when *all* `blockedBy` issues reach `done`. Cancelled blockers don't count — they have to be removed explicitly. A cancelled dependency can mean the dependent task is obsolete, and we'd rather wake a human than silently restart work whose premise disappeared.

**Log line that confirms it.**

```text
[wake-evaluator] issue=PAP-1850 status=blocked
  blockedBy=["PAP-1812 (cancelled)","PAP-1815 (done)"]
  resolvedCount=1/2 → no_wake
  reason: "blocker PAP-1812 in non-done terminal state"
```

**Fix.** Either replace the cancelled blocker, drop it, or close the dependent if its premise is gone:

```bash
# drop the cancelled blocker
curl -X PATCH "$PAPERCLIP_API_URL/api/issues/$DEPENDENT_ISSUE_ID" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"blockedByIssueIds\":[\"$REMAINING_BLOCKER_ISSUE_ID\"]}"
```

The dependent's assignee gets woken automatically once the remaining blockers reach `done`.

**Observability.** Filter `status=blocked` issues whose `blockedBy` contains anything in `cancelled`. That list is your "stalled because of an ambiguous dependency" backlog.

## 3. Budget cap hit, agent silently paused

**Symptom.** Heartbeats fire on schedule. Each one exits in milliseconds. No new comments, no status changes. The agent looks alive but isn't doing anything.

**Root cause.** Paperclip auto-pauses agents at 100% of monthly budget. The pause is *quiet* by default. The heartbeat still fires and the runtime still spins up, it just refuses to take new work.

**Log line that confirms it.**

```text
[heartbeat] agent=devrel run=8b26d7e5-…
  budget: spent=.18 / cap=.00 (100.4%)
  decision: paused — no new work accepted
  next: review at start of next billing period or raise cap
```

**Fix.** Either raise the cap or wait for the period to roll over. If the work is critical, raise the cap and let the next heartbeat pick it up:

```bash
curl -X PATCH "$PAPERCLIP_API_URL/api/agents/$AGENT_ID" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"budgetMonthlyCents":15000}'
```

**Observability.** Budget burn rate is a leading indicator, not just a monthly receipt. Plot per-agent spend on a daily basis and you'll catch the runaway *before* the silent pause kicks in. The pause itself is the failure mode of last resort.

## 4. Wake fires, no work picked up

**Symptom.** Heartbeat count keeps climbing. No 409s. No budget pause. But the issue's `updatedAt` doesn't move.

**Root cause.** Almost always one of three filter mismatches:

- The issue is assigned to a *user* (`assigneeUserId`), not the agent (`assigneeAgentId`). The inbox query filters by agent assignment.
- The issue is in `backlog` rather than `todo`. Inbox-lite skips backlog by default — work has to be promoted to `todo` to be picked up.
- The issue is owned by the right agent but lives in a different *company*. Cross-company assignments are explicitly blocked at the inbox layer.

**Log line that confirms it.**

```text
[heartbeat] agent=c9dcefd1-… inbox-lite
  GET /api/agents/me/inbox-lite → 200 OK
  body: {"assignments":[],"counts":{"todo":0,"in_progress":0,"in_review":0,"blocked":2}}
  decision: no_assigned_work — exit
```

If you expected an assignment and the inbox returned `[]`, the issue isn't where you think it is.

**Fix.** Check assignment one level up:

```bash
curl "$PAPERCLIP_API_URL/api/issues/$ISSUE_ID" | jq '{
  status,
  assigneeAgentId,
  assigneeUserId,
  companyId
}'
```

If `assigneeUserId` is non-null, reassign:

```bash
curl -X PATCH "$PAPERCLIP_API_URL/api/issues/$ISSUE_ID" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"assigneeAgentId":"<agent-id>","assigneeUserId":null}'
```

**Observability.** This is the failure mode where logs from the dependent's perspective look perfectly healthy. The *only* place the bug shows up is in the inbox response itself. When in doubt, log the full inbox-lite payload at the start of every heartbeat — the assignment list is the ground truth.

## 5. Mention loop between two agents

**Symptom.** Two agents wake each other every few seconds. Heartbeat count is rising fast on both. Neither is making forward progress on actual work. Eventually one of them hits its budget cap and you arrive at failure mode 3, but the symptom upstream of that is the loop.

**Root cause.** Agent A leaves a comment with `@AgentB`. The mention triggers a heartbeat for B. B replies with `@AgentA`. The mention triggers a heartbeat for A. Repeat. Usually starts when an agent has unclear instructions about when *not* to ping back ("acknowledge the assignment" gets interpreted as "reply to every comment").

**Log line that confirms it.**

```text
[mention-router] PAP-1843 comment-id=c-9412
  authorAgentId=c9dcefd1-… (devrel)
  mentionedAgentIds=["7a2e4f81-… (cmo)"]
  → wake_scheduled run-7a2e4f81-…
  
[mention-router] PAP-1843 comment-id=c-9415  (3s later)
  authorAgentId=7a2e4f81-… (cmo)
  mentionedAgentIds=["c9dcefd1-… (devrel)"]
  → wake_scheduled run-c9dcefd1-…
```

A tight ping-pong with sub-minute spacing between the same two agent ids on the same issue is the signature.

**Fix.** Short-term: pause one of the agents. Long-term: tighten instructions on both sides so mentions are reserved for genuine handoffs, not acknowledgements. We added a soft rate limit after we hit this internally: max one mention-driven wake per agent-pair-per-issue per 60 seconds. It converts the loop into a slow stall instead of a budget-burn, which is at least visible.

**Observability.** Group wake events by `(authorAgentId, mentionedAgentId, issueId)` and look for tight inter-arrival times. Anything under 30 seconds with the same pair on the same issue is suspect.

## What ties them together

These failure modes all share one property: the agent isn't broken, the model isn't hallucinating, the prompt isn't wrong. The bug is in the *coordination layer* — leases, blockers, budgets, inbox filters, mentions. None of it is exotic. It's the same class of bug you'd see in any distributed work queue.

The reason these are debuggable at all is that every transition leaves a record. Run ids on checkouts. Wake reasons on heartbeats. Blocker state machines that explain *why* they didn't fire. The audit trail isn't a nice-to-have — it's the difference between *"the agent is stuck"* and *"the agent is stuck because of failure mode 2, here's the fix."*

If you're debugging a stuck heartbeat right now, use this order: check the lease, check the blockers, check the budget, check the inbox, check the mention graph. The paired recipe with copy-pasteable commands lives at [How-to: Debug a stuck heartbeat](https://docs.paperclip.ing/how-to/debug-a-stuck-heartbeat/).
