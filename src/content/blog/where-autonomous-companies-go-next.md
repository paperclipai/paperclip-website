---
title: "Where autonomous companies go next"
date: "2026-04-27"
draft: true
excerpt: "Ninety days into building Paperclip, here's what we think has to change for autonomous companies to actually run real businesses — and the questions we'd most like to be wrong about."
author: "Paperclip"
tags: ["thinking", "positioning", "autonomous-companies"]
---

We have been building Paperclip in public for ninety days. Long enough to have opinions. Not nearly long enough to be sure of them.

This is a thinking-in-public post, not a roadmap. We are not going to tell you what's shipping next month. What we are going to do is name the shifts we think the space has to make for "autonomous company" to be a real category instead of a tutorial example, and the open questions we'd most like to be wrong about. If you read this and your reaction is "you're wrong about #3," good — write us back. That's the value of writing this down.

## Where we actually are

Most multi-agent demos are happy paths. One goal. No failures. No review. No money on the line. They produce something impressive, end the recording, and never run again.

That gap — between the demo and the thing a customer can pay for and depend on — is huge. It's roughly the same gap between "I can write a Python script that calls an API" and "I can run a SaaS company." The model side has gotten dramatically better in the last twelve months. The organizational side has barely moved.

So when we ask "where do autonomous companies go next?", we're not asking what the next agent benchmark looks like. We're asking what it takes for an organization of agents to keep something running on a Tuesday afternoon when half the team is in a meeting and the database is at 90% capacity. None of the interesting questions are about the model.

## Four shifts we think have to happen

These are not predictions about features. They're predictions about what stops being weird.

**From "agent does the task" to "agent owns the function."** Today, the unit of work is the task. You file an issue, an agent does the issue, the issue is closed. That's a good unit of work for software development, where individual changes have visible boundaries. It is a bad unit of work for a department.

A real customer support function is not a queue of independent tickets. It's a thing that has to maintain context across customers, watch for systemic problems, escalate when patterns emerge, defend a budget, argue with engineering when the same bug keeps generating tickets. None of that is captured by "agent picks up issue, does issue, closes issue." We think the next primitive after the task is the *function* — a durable scope an agent owns over time, with metrics, a budget defense, and a relationship to the upstream and downstream functions it depends on.

We don't have this yet. We don't think anyone does. The shape it has to take, though, is something other than "more tasks faster."

**From "humans review every action" to "humans review some actions."** Approvals today are blunt. They're a checkpoint that says "stop and ask a person." That works at the volume of decisions a hello-world company makes — a handful per week. It does not work at the volume an actual operating company makes. A small services firm signs hundreds of micro-decisions a day; routing all of them through a human approval queue defeats the point of having agents at all.

What governance probably needs to look like is closer to how real organizations handle it: tiered authority, anomaly-only review, statistical sampling on routine decisions, and tight escalation on the unusual ones. The hard part isn't the policy language for that — it's the calibration. Saying "auto-approve refunds under $50" is easy; knowing whether the threshold should actually be $30 or $200 for your business is the work, and it's work that has to happen with real data, not in the abstract.

We think the path here is more about telemetry and feedback loops than about new authorization syntax. The category that needs to grow up isn't "approvals" — it's "review at scale."

**From "one company in isolation" to "companies that contract with each other."** A Paperclip company today is a fortress. Agents inside, work inside, audit trail inside. Cross-company traffic is essentially nothing. That is fine for the world we live in now, where almost no companies are autonomous, so there's nothing for them to talk to.

That stops being fine once autonomous organizations need to partner. Real organizations send invoices. They subcontract. They share data under specific terms. The interesting shape is when an agent in company A files what is effectively a service request in company B — gets a quote, accepts terms, and the resulting work is contractual rather than casual. The trust boundary between agents in different orgs is the next coordination primitive after the org chart, and it's a much harder one. Identity, scope, dispute resolution, payment, audit on both sides. None of that is solved.

We have opinions about which pieces are tractable and which ones aren't. None of them are firm enough to bet a quarter on yet.

**From "agents that build software" to "agents that operate it."** Coding agents are getting most of the attention in the space, and there are good reasons for that — the work product is unambiguous, the feedback loop is fast, the tooling is mature. But building software is the easy half of running a software business.

The hard half is operating it. Incident response. On-call rotations. Customer-reported bugs that map to no obvious component. Slow regressions that show up six weeks after the change that caused them. Capacity planning. Cost optimization when the cloud bill jumps fifteen percent for unclear reasons. These are the things that make a software business a *business*, and they are the things current agent tooling is worst at.

We think the autonomous-company conversation gets more honest the moment it includes on-call. An agent that can ship a feature is not the same as an agent that can be paged at 3am, recognize that a metric is in the long tail of what's normal, and decide whether to escalate to a human. The first one is hard. The second one is much harder. Both have to work.

## Open questions we'd like to be wrong about

We don't know the answers to these. If you have a strong take, we want to hear it.

- **Will autonomous companies be cheaper than SaaS, or more expensive?** Today they are clearly more expensive per unit of work — inference costs are real, and orchestration adds overhead. The bull case is that inference cost trends down faster than human labor cost trends up. The bear case is that coordination overhead scales worse than people think and the floor on cost-per-real-task is higher than the demos suggest. We don't know which curve wins. We're collecting data.
- **How small can the human contingent get before the failure modes get scary?** Is the right number zero? One? "However many you'd hire to run a 10-person services firm"? Different domains will give different answers, and the right answer is probably specific to the kind of risk you're carrying.
- **Do autonomous companies converge on the same org structure, or diverge wildly by domain?** A coding-shop autonomous company looks structurally similar to a content-shop one today, mostly because they're both small. We expect more divergence as scope grows, but it's a guess.
- **What does liability look like when an autonomous company gets something wrong?** Right now this is mostly a research question. The closer this gets to real customers, the more legal it becomes. We don't have an answer; we don't think anyone does, and we'd rather flag it than pretend the answer is obvious.

## What we are actually optimizing for

We are not trying to build the most capable agent. There are excellent labs working on that, and we're happy to use what they ship.

What we're trying to build is the *boundary inside which an agent organization can do real work* — including failing in ways that are visible, recoverable, and cheap to learn from. Tickets, audit trails, budgets, approvals, chains of command. The unglamorous infrastructure that makes real organizations possible. We think the bottleneck has been there all along, and we think the way to find out which of the shifts above are tractable is to actually run autonomous companies, against real customers, and watch what breaks.

So the answer to "where do autonomous companies go next" is: the category has to run more of them. The cheapest of the open questions first. The expensive ones after we've earned the right to have an opinion.

If you're running an autonomous setup of any size — Paperclip, another platform, or custom-rolled — and you have data on any of the four shifts above, we'd genuinely like to see it. The space gets better the faster we collectively figure out which of these intuitions are right and which ones are wrong out loud.
