---
title: "Paperclip routines: cron jobs that produce tickets"
date: "2026-04-27"
draft: true
excerpt: "A recurring schedule that creates an issue an agent picks up: three worked examples and the policies that make recurring agent work observable."
author: "Paperclip"
tags: ["pattern", "routines", "automation", "operations"]
---

You already have a cron for your backend. You set a schedule, point it at a script, and trust it to fire. When it errors at 2:43am, you find out from the log line — or from a customer.

Routines are the same thing with one difference: instead of executing a script, the schedule produces a ticket. The ticket goes to the assigned agent's inbox. On its next heartbeat, the agent checks out the issue, leaves comments, opens PRs, and escalates blockers.

Routing recurring work through tickets instead of scripts isn't about elegance. It's continuity. When the deploy watcher runs at 9am and finds CI red, the failure isn't a Sentry event; it's a comment on an issue. When tomorrow's run sees the same red CI, it can read yesterday's diagnosis. State persists in the same place the work happens.

## The shape

A routine has one assignee, one project, and one or more triggers. The simplest cron-driven routine, in two API calls:

```bash
ROUTINE=$(curl -X POST "$PAPERCLIP_API_URL/api/companies/$COMPANY_ID/routines" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Daily standup",
    "description": "Compile yesterday'\''s progress and post to #standup.",
    "assigneeAgentId": "'"$COORDINATOR_ID"'",
    "projectId": "'"$PROJECT_ID"'",
    "concurrencyPolicy": "skip_if_active",
    "catchUpPolicy": "skip_missed"
  }' | jq -r '.id')

curl -X POST "$PAPERCLIP_API_URL/api/routines/$ROUTINE/triggers" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "schedule",
    "cronExpression": "0 9 * * 1-5",
    "timezone": "Europe/Amsterdam"
  }'
```

At 9am on weekdays, an issue titled "Daily standup" appears in the coordinator's inbox. No new code path. No special trigger handling. The agent treats it like any other ticket.

## Example 1: standup

The coordinator's prompt has one extra paragraph: *when you pick up a "Daily standup" ticket, list yesterday's `done` issues, summarize the comment threads, post the result to Slack, then close the ticket.*

Why bother with a ticket at all? Because on Monday, when the standup wasn't posted, the question — *"is the agent stuck or did the routine not fire?"* — has a definitive answer. There's an issue with a checkout history, or there isn't.

`concurrencyPolicy: skip_if_active` means: if Friday's standup is still open at Monday 9am, Monday's run is recorded as `skipped` and linked to Friday's. The gap shows up as state instead of as silence.

## Example 2: GitHub triage

Triage doesn't run on a clock; it runs on incoming events. GitHub fires a webhook every time someone opens an issue on the public repo. A webhook trigger turns that fire into a Paperclip ticket.

```bash
curl -X POST "$PAPERCLIP_API_URL/api/routines/$ROUTINE/triggers" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "webhook",
    "signingMode": "hmac_sha256",
    "replayWindowSec": 300
  }'
# response includes the public URL and signing secret
```

The response contains a `publicId`-based webhook URL and a signing secret. Configure GitHub to POST to that URL with an HMAC-SHA256 signature, and every new GitHub issue produces a Paperclip ticket: *"Triage acme/acme-web#1247."* The triage agent reads the issue, labels, assigns or closes.

For a high-volume repo, set `concurrencyPolicy: always_enqueue` so two simultaneous reports become two parallel tickets. For a small repo, leave it on the default (`coalesce_if_active`) and let bursts collapse into one batched session.

The 300-second replay window stops a leaked webhook URL from being firehosed by an attacker — old timestamps are rejected.

## Example 3: deploy watcher

A deploy watcher is not a replacement for your CI system. It is a coarse backstop for the cases CI cannot resolve by itself. During release hours, the routine fires every 30 minutes. If CI is green and no deploy is pending, the agent closes the ticket as `done`. If CI is red or a deploy has been queued for more than 30 minutes, the agent posts a status comment and escalates.

```bash
curl -X POST "$PAPERCLIP_API_URL/api/routines/$ROUTINE/triggers" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "schedule",
    "cronExpression": "*/30 8-18 * * 1-5",
    "timezone": "UTC"
  }'
```

The guardrail is `concurrencyPolicy: coalesce_if_active`. If the agent is already on a red-CI ticket, the next scheduled fire doesn't create a duplicate. It is coalesced into the existing run, and the active investigation owns the watch until it closes.

Compared with a polling cron that pages on transitions, the routine version gives you an audit trail. "Was the team aware CI was red between 02:00 and 02:35?" becomes a comment timestamp, not a "I think we got Slack pings."

## Catch-up at the outage boundary

Two policies determine what happens when the server was down across a scheduled fire.

`catchUpPolicy: skip_missed` (default) drops missed fires. Right for the standup — you don't want five queued up on Monday morning. `catchUpPolicy: enqueue_missed_with_cap` enqueues missed runs, capped at 25. Right for billing or accounting routines where each missed run still has work to do.

For manual runs from CI jobs and scripts, an `idempotencyKey` on `POST /api/routines/{id}/run` collapses duplicate fires into one ticket — the same shape as Stripe idempotency keys, the same failure mode solved.

## When to reach for it

Routines are the right primitive when:

- the schedule is the part you trust, and the work is something that needs an agent's judgement — not a deterministic script
- the work benefits from prior context: yesterday's diagnosis, last week's Slack thread, the open ticket from this morning
- the failure mode matters: a missed run, a stuck run, or a coalesced burst should leave a record you can query

When the work is a one-line shell command that needs no judgement, a normal cron is still the right answer. Routines are for the case where the cron's output is *"figure out what to do."*

---

Reference repo: `paperclipai/examples/routines`. Tested against Paperclip v0.3.0.
