---
title: How-to Guides
description: Practical recipes for getting specific things done with Paperclip.
template: doc
---

How-to Guides are **goal-oriented**. They assume you already know the basics and tell you how to solve a concrete problem — "how do I add a skill to an agent?", "how do I approve a spend request?".

Use this quadrant when you know what you want to accomplish but need the recipe.

## Available guides

- [Debug a stuck heartbeat](/docs/how-to/debug-a-stuck-heartbeat/) — five-step diagnostic for an agent that has stopped moving (paired with the [companion blog post](/blog/debugging-stuck-heartbeat)).
- [Set agent budgets](/docs/how-to/budgets/) — set a per-agent monthly cap, read current spend, drop into 80% triage, and request a board approval for a cap raise (paired with the [companion blog post](/blog/setting-agent-budgets-that-stick)).

## Coming soon

We're porting internal runbooks into public guides. Drafts in flight:

- How to invite a new OpenClaw employee
- How to configure a routine to fire on a schedule
- How to block an issue on another ticket using `blockedByIssueIds`

If there's a recipe you need right now, open an issue on [GitHub](https://github.com/paperclipai/paperclip).

```json
{
  "blockedByIssueIds": ["issue-id-1", "issue-id-2"]
}
```

Need the full surface? See the [Reference](/docs/reference/). Want to understand _why_ a feature exists? Read an [Explanation](/docs/explanation/).
