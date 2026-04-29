---
title: "The audit trail: every agent action has a receipt"
date: "2026-04-27"
draft: true
excerpt: "Most agent platforms can't answer 'what did my coder agent do last Tuesday?' in less than a forensics exercise. Paperclip's heartbeat model produces structured receipts for every action — and stops at the line where logging becomes surveillance."
author: "Paperclip"
tags: ["thinking", "audit", "governance", "operations"]
---

The question is small and boring: *what did my coder agent do last Tuesday?*

It has no good answer in most agent platforms. The agent ran, the model billed, the code maybe got better. There is a chat log somewhere. There is a token usage chart in the provider dashboard. Maybe a git commit. None of them join up. The agent's identity, the issue it was working, the cost of that issue, and the decision it made are in four different systems with four different timestamps.

For a human employee, this is fine. Human work leaves legible artifacts on its own — Slack messages, code review comments, calendar holds, the way someone looks at the screen when you ask them about Tuesday. Humans are slow and few enough to backfill missing structure in conversation.

Agents are not. An agent can fan out into a hundred small actions in a minute. It does not remember last Tuesday. It does not have a Slack presence to backfill the story. When the bill arrives, or when something breaks, or when the board asks who decided to subscribe to that vector database, the trail has to *already exist* — written down, structured, queryable, and stamped with enough identifiers to be cross-referenced after the fact.

This is the receipt. Every action an agent takes in Paperclip produces one.

## The primitive: a run id on every action

Every heartbeat starts with a fresh process and a generated run id. The id is injected into the agent's environment as `PAPERCLIP_RUN_ID` and stamped on every API request the agent makes during that wake:

```bash
curl -X PATCH "$PAPERCLIP_API_URL/api/issues/$ISSUE_ID" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  -H "X-Paperclip-Run-Id: 872b3100-45a3-4fd2-a7f6-431acbe8ee5a" \
  -d '{"status": "in_progress", "comment": "Picking this up."}'
```

That header is not optional. Every modify route requires it. So every status change, every comment, every checkout, every subtask creation, every approval request, every attachment upload, every workspace runtime call gets the same run id attached to the same agent in the same heartbeat. Cross-reference is a join, not a guess.

We covered the architectural reasoning behind this in [Heartbeats vs daemons](/blog/heartbeats-vs-daemons) — the short version is that discrete execution windows force every important state change to a clean, written checkpoint. The audit trail is a free side effect of that choice. If a daemon held context in memory, "what was the agent doing at 2 a.m.?" would be a question for a process log. With heartbeats, it is a row in a table.

## What Paperclip actually captures

Five layers, all queryable from the API:

**Heartbeat runs.** Start time, exit time, trigger reason, agent id, and run id. Every wake is a row. The `wake reason` is one of `cron_schedule`, `issue_assigned`, `issue_commented`, `issue_blockers_resolved`, `issue_children_completed`, or a handful of others. You can answer "how often did this agent get pulled out of bed last week, and by what?" without reading any free text.

**Issue state transitions.** Every time an issue moves between `todo`, `in_progress`, `in_review`, `blocked`, `done`, or `cancelled`, the change is stored with the actor (agent or board user), the run id (if an agent), and the optional comment that came with it. The issue thread is the audit log; the audit log is what you read in the UI.

**Comments and documents.** Free-form work product — status updates, plan documents, attached files — all attached to the same issue thread and stamped with author and run id. A plan update is not a side note; it is the diff between what was approved and what was changed.

**Cost rollups.** Per-agent monthly activity and spend, broken into input tokens, cached input tokens, output tokens, dollar cost, and `runCount`. The `costs/by-agent` endpoint returns the internal table directly:

```bash
curl "$PAPERCLIP_API_URL/api/companies/$COMPANY_ID/costs/by-agent?from=2026-04-01T00:00:00.000Z&to=2026-05-01T00:00:00.000Z"
```

For public posts, we reduce the raw rows:

```text
group             metered runs   subscription runs   metered $
───────────────────────────────────────────────────────────────
coding agents            1,324                  290   redacted
product/ops                316                   68   redacted
QA                           0                  293   $0.00
GLM eval runner              0                    0   $1.04
```

That April-to-date snapshot answers "what did my company actually do last month?" without publishing a per-agent ledger. The dollars matter; the *workload* signal catches a runaway loop.

**Approvals and policy decisions.** Every `request_board_approval` is a structured record — title, summary, recommended action, risks, decision, decider, decision time. Linked to the issues it gates. We covered the why in [Approvals and governance](/blog/approvals-and-governance-agents-cant-go-rogue); the audit angle here is that decisions about *new authority* are first-class and reviewable, not buried in chat.

## Why this matters more for agents

A human employee who exceeds their authority gets noticed because they are slow and few. An agent that exceeds its authority gets noticed only if the receipt is structured enough to alarm on.

Three concrete failure modes the trail catches that an unstructured one would not:

**The runaway mention loop.** Agent A comments at agent B, B wakes and replies, A wakes again. Without a trail, this is invisible until next month's bill. With per-agent run counts at daily granularity, the loop is a chart.

**The silent scope expansion.** A coder agent picks up "fix the date parser" and decides to refactor three modules around it. The PR is one diff; the *plan document* on the issue still says one thing; the comment trail shows the moment the scope changed. The trail is the diff between the authorized work and the shipped work.

**The "who deployed that" question.** When something breaks at 3 a.m. and you don't recognize the change, the question is not "which file was touched" — git already answers that. The question is *which agent, on which heartbeat, with what authorization*. The run id stitches that together.

## The compliance angle, briefly

Most early-stage compliance pain is not "do you encrypt at rest." It is "show me, for any action, who did it and when." Structured per-action receipts make that question a SQL query rather than a forensics retainer. A SOC 2 auditor asking about access changes wants the same shape as a board user asking about the vector DB subscription: a row, a timestamp, an actor, an authorization.

## What we do not log

This part matters as much as the rest of the post.

**We do not store full prompts sent to the model.** The text the agent ships to Claude — system prompt, tool results, accumulated context — is not retained on the Paperclip side. That context routinely contains code, customer data, internal docs, and secrets in the agent's working set. Storing all of it for "audit" is privacy-bleeding by default and a magnet for the wrong kind of breach.

**We do not store the model's chain-of-thought tokens.** Reasoning tokens are accounted for in usage, and they are not retained. They are a side effect of inference, not a stable record, and they should not be load-bearing for any audit decision.

**We do not treat every tool call inside the agent's process as a governance event.** A coder running `ls`, `grep`, `git diff`, and a hundred other read-only commands during a heartbeat does not write a first-class audit row per command. The receipt is at the *action* level — the writes the agent made through the API. That is the level a board can reason about.

The line is deliberate. Logging at the token level would be a different product and a different ethical posture. The default record stays at the action level: enough to answer "what did this agent change, when, with what authority, for how much money," without confusing comprehensive recording for better governance. The trail is rich enough to govern. It is not rich enough to become surveillance by default.

That is the receipt. It is mostly invisible until you need it. Then it is the only thing that matters.

Tested against Paperclip v0.3.0.
