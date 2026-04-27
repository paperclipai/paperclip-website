---
title: "Heartbeats vs daemons: why we chose discrete execution windows"
date: "2026-04-27"
excerpt: "The first version of Paperclip ran agents as long-lived daemons. Three production failure modes pushed us to discrete execution windows. Here's what that swap costs and what it buys."
author: "Paperclip"
tags: ["thinking", "heartbeats", "architecture"]
---

When you start sketching a system that lets agents work on tasks over time, the obvious shape is a process. An agent is a thing that's *running*. It boots, you hand it a goal, it stays alive until the goal is done. That's how the demos work. That's how a person would naturally model "an agent doing my work in the background."

We started there. The first version of Paperclip's runtime kept agents alive as long-lived daemons — one process per agent, polling for new work, holding context in memory, exiting only on shutdown. It worked for hello-world. It started breaking the moment the work got real.

This is the architecture-decision story. Why a persistent loop seemed obvious, what pushed us off it, what we replaced it with, and what we gave up in the swap.

## The naive take

If you've written any agent code, you've probably written a loop that looks like:

```python
while True:
    work = poll_for_assignments()
    if work:
        do(work)
    sleep(5)
```

This is the daemon model. It's the default in early multi-agent literature. It maps cleanly onto the mental model of "agent = autonomous worker." The agent has continuity. It remembers what it was doing. It can react quickly to new input. The system prompt fits comfortably at the top of an in-memory context window.

Everything is fine. Until you put one in production.

## Three production failure modes

We hit these in roughly this order. None is exotic. All three have analogues in any distributed system; what makes them sharp for agents is that the per-action cost is real money.

**Crashes leave no resumption signal.** A daemon mid-task carries state in memory. When the process dies — OOM, host reboot, network blip, supervisor decision — that state is gone. The work it was doing is in some intermediate place: maybe a partial commit, maybe a half-written comment, maybe a half-spent token budget. The next process boot doesn't know what was in flight, because "in flight" was a Python variable. We needed a way to ask, from the outside, *what was this agent doing when it died, and how do I resume it?* The daemon model didn't have a good answer. The audit trail was a process log, and the process log doesn't survive a kernel panic.

**Cost has no natural ceiling.** A daemon that's always running is always reading. Every poll is context-loaded; every "is there anything to do?" check costs a few cents. When idle is free, you don't think about the cost of polling. When idle is metered, you do — fast. Worse, there was no natural moment to compare *spend so far this period* against *budget cap*. The cap was a number in a database; the agent never paused at a clean boundary to look at it. We watched a coordinating agent burn through a noticeable daily budget reading its inbox into context to decide there was nothing to do.

**Concurrency requires a lease and the daemon doesn't have one.** Two agents on the same task is a coordination problem. With persistent processes, the obvious answer is in-memory locks — but those don't survive restarts. The next answer is database leases — but a lease needs an expiry, an expiry needs a renewal heartbeat, and a renewal heartbeat is functionally the discrete-execution model creeping back in through the side door. Once we wrote the renewal logic, the question got loud: *if every interesting state transition is happening at heartbeat time anyway, what is the daemon for?*

That last one was the one that flipped us.

## The heartbeat model in one paragraph

We replaced the loop with a discrete-window model. An agent doesn't run continuously. A trigger — a cron schedule, a comment on an assigned issue, a mention, a blocker becoming resolved — wakes a fresh process. That process reads the agent's inbox, checks out one issue (acquiring a short lease stamped with a run id), does one chunk of work, writes its progress as a comment or status change on the issue, and exits. The next trigger boots a new process. No long-lived state, no in-memory context across runs, no polling. The full mechanics live in the [Explanation docs](/docs/explanation/).

```text
Daemon model
─────────────────────────────────────────────────────► time
[start]  [=========== one long process ============]  [crash?]
            no checkpoints · state in memory
            audit trail = a process log

Heartbeat model
─────────────────────────────────────────────────────► time
[wake][exit]   [wake][exit]   [wake][exit]   [wake][exit]
   ↑              ↑              ↑              ↑
trigger        comment        comment        comment
            audit trail = the issue thread
```

## What this forces you to give up

The swap is not free. We lost three things, and you should know whether you can live with that before adopting the same pattern.

**Real-time reaction.** An agent can't notice that something has changed the instant it changes. The wake has to fire. For a comment-driven wake, that's effectively immediate. For a schedule-driven check, it's whatever the cadence is. If you need sub-second reactions to events, the heartbeat model is wrong; you want a stream consumer instead.

**Cross-run continuity of "thinking."** There's no context window that spans hours of an agent's work. Every wake is cold. The agent's memory of what it has done lives in the issue thread — comments, status changes, attached documents — and not in a hot context. This is a forcing function: anything important has to be written down. Anything not written down is gone at the end of the wake.

**Polling-style intelligence.** "Watch this dashboard and notice when X drifts" is a bad fit. We push that work into [routines](/blog/routines-cron-jobs-that-produce-tickets) — cron-style wakes that check a thing on a schedule — instead of giving an agent ambient awareness. It's less elegant. It's also much easier to budget and audit.

## What this buys

The reasons we made the trade:

**Debuggability.** Every state change has a run id, a timestamp, and a written trail on the issue. When an agent gets stuck, the question becomes *why didn't the next wake make progress?* — and there are roughly [five answers](/blog/debugging-stuck-heartbeat), all of which we've documented. With a daemon, "the agent got stuck" is the start of a forensics exercise on a process log.

**Cost predictability.** Every wake has a measurable bounded cost. Idle is genuinely free. A per-agent monthly cap is enforced at the boundary of every wake, not somewhere inside an always-running loop. [Budgets stick](/blog/setting-agent-budgets-that-stick) because there's a clean point to check them.

**Recovery.** If a wake crashes, the issue's lease expires. The next wake adopts it. The comment trail tells the new process what was already done and what's left. There's no in-memory state to lose, because there was no in-memory state to begin with. We've had agents resume work after host reboots, network partitions, and moves between machines, with no special code path.

**Auditability.** Every action is attached to a run, every run to an agent, every agent to a budget. "What did this agent do last Tuesday" is a query, not a log dive. That property is what makes the rest of the governance model — approvals, [chains of command](/blog/agents-need-org-charts), board oversight — load-bearing rather than aspirational.

## When you would still want a daemon

We're not claiming the daemon is wrong for everyone. It's the right shape if your work is stream-oriented (real-time chat, market data, latency-sensitive control loops), if your context legitimately doesn't fit on disk between runs, or if the per-wake startup cost dominates the per-wake work. None of that describes the work we're optimizing for, which is the unit of "an organization of agents shipping tickets."

The bet underneath the heartbeat model is that the work most autonomous companies need to do looks more like a software team's ticket queue than a packet-processing pipeline. If that's wrong, the model is wrong. If that's right, the simpler shape — wake, work, write, exit — pays for itself the first weekend an agent doesn't quietly burn through budget while you sleep.
