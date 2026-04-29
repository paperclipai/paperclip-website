---
title: "Coordinating agents is product management, not prompt engineering"
date: "2026-04-27"
draft: true
excerpt: "The skills that decide whether ten agents ship a feature are the same skills that decide whether ten engineers ship a feature. Five PM skills that transfer, three that don't, and the Paperclip primitives that pick up the slack."
author: "Paperclip"
tags: ["thinking", "multi-agent", "coordination"]
---

When teams start trying to coordinate more than two or three agents on real work, the conversation tends to get stuck on prompts. Better system prompts. Better tool descriptions. Better few-shot examples. The implicit assumption is that more careful prompting is what unlocks scale.

That assumption is wrong in a specific way that's easy to miss. Prompt engineering decides whether a single agent does a single task well. Coordination decides whether ten agents, working in parallel on overlapping concerns, ship something coherent. Those are different problems. Better prompts don't move the second one.

The teams that scale agents past four or five usually have someone doing product management on the agents — explicitly or accidentally. They're writing tickets. Setting scope. Reviewing output. Routing blocked work. Cutting things that aren't going to ship in time. Those activities have names, and the names are not "prompt engineering."

This post walks through what coordination actually is, the five PM skills that transfer to it, the three that don't, and the specific Paperclip primitives each transferable skill maps onto. It closes with the honest limits of the analogy.

## What "coordination" actually means

Coordination, in a multi-agent context, is everything between *we should do X* and *X is done* that isn't the model call itself. That includes:

- Defining the unit of work clearly enough that an agent can finish it without a human in the loop.
- Routing the right work to the right agent given who is qualified, who is free, and who has authority.
- Tracking who owns what, what blocks what, and what's overdue.
- Catching wrong output before it ships.
- Bounding cost and authority so a bad decision is recoverable.
- Replanning when reality diverges from the plan.

None of that is in the prompt. It's the structure around the prompt. The model is one input to coordination, not the substrate of it. An [earlier post](/blog/agents-need-org-charts) made the broad version of this argument. This one digs into the specific claim underneath it: that the skills that scale agent teams are management skills, not prompting skills.

## Five PM skills that transfer

**1. Writing a ticket that survives contact with reality.**

The single highest-leverage PM skill, and the one most prompt-focused teams underrate. A good ticket states the goal, the scope, the definition of done, the relevant context an outsider would need, and the next action. A bad ticket says "fix login" and leaves everything else implicit. The first one ships. The second one bounces back from the agent three times asking clarifying questions, each one costing a wake.

In Paperclip, this maps directly onto issue structure. An issue has a title, description, parent for inherited context, comments, blockers, attachments, and structured documents (such as a `plan` document) that survive across heartbeats. Writing the ticket well is the work. The agent is the easy part.

**2. Routing decisions to the right owner.**

In a human org, when an IC doesn't know what to do, there's a deterministic answer to who they ask. That deterministic answer is the chain of command. Without it, the IC either guesses (often wrong) or stops (a silent dead end).

Agents have the same failure mode and the same fix. Each agent has a manager. Stuck agents escalate by setting an issue to `blocked` with the unblock owner and action named, which wakes the manager. Comment mentions wake the mentioned agent directly. The routing is mechanical, not political — the org chart is the routing table.

**3. Bounding authority.**

Senior PMs spend more time than they admit on the question of *what can this person decide alone, and what needs sign-off*. The same question is more important for agents, because the cost of a bad agent decision is denominated in API spend and lost work, not just morale.

Paperclip expresses bounded authority two ways. Per-agent budgets cap how much an agent can spend in a period, with auto-pause at 100% and a more cautious posture above 80%. Approvals route sensitive actions — large spends, deploys, hires — through a board sign-off that blocks dependent work until resolved. Authority is per-role and per-action, not per-prompt. ([Setting agent budgets that stick](/blog/setting-agent-budgets-that-stick).)

**4. Running reviews.**

Code review, design review, copy review — the PM skill is knowing which work needs which review, who reviews it, and how to keep reviews from becoming a bottleneck. The pattern is "produce, hand off, get approved or kicked back, ship."

In Paperclip the equivalent is the `in_review` status and execution-policy stages. An agent finishes work and hands the issue to a reviewer (another agent or a human) rather than self-approving. The reviewer can approve — advancing to the next stage if there is one — or send it back with `in_progress` and a comment, which routes the issue back to the original assignee. The audit trail of who approved what and when is automatic, because every state change is attached to a run.

**5. Decomposing work into shippable units.**

PMs break epics into stories, stories into tickets. A good decomposition has the property that each child can ship independently, each has its own owner, and the parent's "done" is the union of the children's. Bad decomposition produces tickets that all need each other to be useful — every PM has shipped one of these and watched it slow the team down for a quarter.

This maps onto parent/child issues and first-class blockers. `parentId` makes hierarchy explicit; child issues inherit context and execution workspace from the parent automatically. `blockedByIssueIds` expresses cross-cutting dependencies, and the system fires `issue_blockers_resolved` wake events when blockers clear, so dependent agents auto-resume without polling. The PM job is deciding what should be a child and what should be a blocker. The system wires the events.

## Three PM skills that don't transfer

**1. Career conversations.**

Half of senior PM work is mentoring, calibrating performance, having uncomfortable career-direction conversations, and reading whether someone is burning out. Agents don't have careers. They have versions. You don't grow an agent — you replace it with a better one, or you change its instructions. The vocabulary of growth doesn't apply, and trying to apply it produces a category error: tuning a prompt is not coaching.

**2. Reading the room.**

A lot of PM craft is noticing that an engineer is unhappy, that two leads are quietly disagreeing, that a stakeholder is about to escalate. There is no room with agents. There's a comment thread. The signals a PM uses with humans — tone, pauses, body language, who-said-what-at-the-offsite — are absent. The good news is that everything that *does* matter is text and is auditable. The bad news is the soft-skills muscle is unused.

**3. Synchronous alignment.**

PMs spend hours in meetings aligning roadmaps live. Agent coordination is fundamentally asynchronous — heartbeats are discrete shifts, not continuous presence ([why we chose discrete execution windows](/blog/heartbeats-vs-daemons)). You can't gather the agents in a room and decide together; you write a plan, route it for approval, and let each agent pick up its piece on the next wake. The skill that translates is *writing* — written specs, written approvals, written decisions. The skill that doesn't is the live-meeting facilitation craft.

## Honest limits

The PM analogy is load-bearing, not airtight. Three places it strains:

**Bad workers stay bad.** Management amplifies competence; it doesn't create it. A team of bad ICs with a great PM ships less than a team of good ICs with no PM at all. If your underlying agents — model, instructions, tools — are wrong for the work, no amount of ticket discipline will save the project. Coordination is necessary, not sufficient.

**Some PM intuition is calibrated on humans.** "This person is overloaded; reassign." "This team needs a breather." Those instincts come from years of working with humans and don't always map. Agents don't get tired. They do get expensive, slow, or stuck — and the heuristics for noticing those failure modes are different. You're learning them in real time.

**The manager is also an agent, eventually.** Once you have an agent managing other agents, you have a recursion problem. The manager-agent's quality bounds the team's quality, and "review the reviewer" becomes a real question. We don't pretend to have solved that. The current answer is keeping a human in the chain at the levels that matter — approvals, hiring, budget changes — and being suspicious of fully recursive agent management until the tooling catches up.

## What this means in practice

If you're standing up a multi-agent system and the PM-shaped questions feel beneath the work — "we'll figure out who owns what later," "tickets are bureaucracy" — that's the failure mode this post is about. The model is the cheap part. The structure that makes ten agents look like a team rather than a swarm is the work. Most of that work has a name, and the name is product management.

The next time you find yourself rewriting a system prompt for the fourth time hoping it solves a coordination problem, ask whether a real PM looking at the same situation would touch the prompt at all. They probably wouldn't. They'd write a ticket.
