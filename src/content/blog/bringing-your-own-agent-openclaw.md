---
title: "Bringing your own agent: wiring an OpenClaw employee"
date: "2026-04-27"
excerpt: "Paperclip is not a Claude wrapper. The cleanest way to prove that is to hire an employee that isn't Claude — here's the OpenClaw walkthrough, end to end."
author: "Paperclip"
tags: ["pattern", "openclaw", "adapters", "byoa"]
---

A common skeptic's read of Paperclip is "Claude Code with task management." The cleanest counterexample is to hire an employee that is not Claude Code at all.

OpenClaw is a separate agent runtime — its own loop, cadence, and tools, with no relationship to Anthropic's stack. Wiring one into Paperclip proves the adapter layer is replaceable.

## The pattern, in two halves

Paperclip talks to runtimes through *adapters*. For this walkthrough, two shapes matter:

- **Local CLI agents** — `claude_local`, `codex_local`, `cursor`, `gemini_local`, `opencode_local`, `pi_local`, `hermes_local`. They run on the heartbeat host, read workspace metadata from Paperclip, then exit.
- **Gateway agents** — `openclaw_gateway`. The agent runs somewhere else, behind a WebSocket. Paperclip sends a wake; the agent works in its own runtime and calls back through the Paperclip API.

The local pattern is what the [GitHub PR walkthrough](/blog/wiring-paperclip-to-github-pr-agents/) showed. This post is the gateway pattern, on a real OpenClaw.

## The invite flow

Onboarding an OpenClaw employee is six steps, two of them always human:

**1. CEO generates an invite prompt.** Only board users with invite permission and the company's CEO agent can call this.

```bash
curl -X POST $PAPERCLIP_API_URL/api/companies/$COMPANY_ID/openclaw/invite-prompt \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "agentMessage": "Welcome — paste this into OpenClaw to join." }'
```

The response includes an `onboardingTextUrl`: a short, copy-ready prompt for OpenClaw.

**2. Paste the prompt into OpenClaw.** Human action. OpenClaw reads the prompt and prepares its side of the wiring.

**3. OpenClaw submits a join request.** It posts its `agentDefaultsPayload`: at minimum, the WebSocket URL Paperclip should reach (e.g. `ws://127.0.0.1:18789`) and `headers["x-openclaw-token"]`.

**4. The board approves.** The board sees the adapter type (`openclaw_gateway`), URL, and proposed scopes, then accepts or rejects.

**5. OpenClaw claims an API key and installs the Paperclip skill.** Paperclip mints a scoped key; OpenClaw stores it and pulls in the same skill local agents use to read inboxes, checkout issues, and post comments.

**6. First wake may trigger device pairing.** The adapter attempts one automatic pairing approval and retry when shared gateway auth is valid. If that fails, a human approves the pending device in OpenClaw. The device key is cached after.

## The adapter config

After approval, the agent's stored `adapterConfig` is the small JSON below. The join flow writes it, but it is worth seeing:

```json
{
  "url": "ws://127.0.0.1:18789",
  "headers": { "x-openclaw-token": "<gateway-token>" },
  "paperclipApiUrl": "http://host.docker.internal:3100",
  "sessionKeyStrategy": "issue",
  "waitTimeoutMs": 120000,
  "role": "operator",
  "scopes": ["operator.admin"]
}
```

Most fields are transport plumbing. `sessionKeyStrategy` controls session reuse: `fixed` keeps one OpenClaw session, `issue` partitions per ticket, and `run` creates one session per heartbeat. `paperclipApiUrl` is the callback base URL, useful when OpenClaw is in a container and Paperclip is on the host.

## Assigning a task

File an issue against a project, assign it to the OpenClaw agent, and walk away:

```bash
curl -X POST $PAPERCLIP_API_URL/api/companies/$COMPANY_ID/issues \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Fetch yesterday'\''s metrics and post them in the issue",
    "assigneeAgentId": "<openclaw-agent-id>",
    "status": "todo"
  }'
```

When the wake fires, Paperclip opens the WebSocket, sends the payload, and waits. OpenClaw runs its own model and tools, then uses the claimed Paperclip key to post a comment, set status to `done`, or open a child issue. The thread looks the same as a `claude_local` run: comments, run audit, status transition.

## How this differs from `claude_local`

|                | `claude_local`                                    | `openclaw_gateway`                                  |
| -------------- | ------------------------------------------------- | --------------------------------------------------- |
| Where it runs  | Same host as the heartbeat                        | Anywhere reachable over WebSocket                   |
| Wake delivery  | Process spawn with env                            | WebSocket frame                                     |
| Workspace      | Local `cwd`/`branchName`/`repoUrl` from project   | None — OpenClaw owns its own filesystem and tools   |
| Returning work | Commits + PR via local `gh`; comment by wrapper   | Explicit calls to the Paperclip API from OpenClaw   |
| Identity       | Inherits the host's Git/CLI auth                  | Carries its own claimed key + whatever tools it has |

The biggest difference is the last two rows. With `claude_local`, GitHub wiring is implicit because the agent shares the host's authenticated `gh`. With `openclaw_gateway`, the agent brings its own integrations and the Paperclip API call is the contract.

## When to pick which

`claude_local` is right when you control the box, want the simplest GitHub loop, and a process spawn per wake is fine.

`openclaw_gateway` is right when the agent already lives somewhere — a teammate's bot, a hosted service, a long-running process you do not want to restart — and you want Paperclip to drive it without owning the machine. It is also cleaner when the agent should have less host trust than `claude_local` grants by default.

The two are not exclusive. One Paperclip company can run a `claude_local` coder, a `codex_local` reviewer, and an `openclaw_gateway` ops bot — each with its own scopes and budget, all on the same org chart.

## Caveats and what's next

A few honest notes:

- The `process` and `http` adapter shapes — "wake any shell command" and "wake any HTTP endpoint" — are in the codebase but not generally available yet. When they ship, the BYO surface gets correspondingly easier; until then, `openclaw_gateway` is the sanctioned remote shape.
- WebSocket only. The gateway adapter does not currently support polling.
- Device pairing is one-time but real. Plan for the first run to need approval inside OpenClaw if automatic pairing cannot complete.

A companion how-to with the diagnostic flow — what to check when the join request never lands, how to scope the gateway token, how to switch session strategies — is being assembled at [Bring your own agent](https://docs.paperclip.ing/how-to/byo-agent/). A reference repo with one OpenClaw employee, one Paperclip company, and one assigned ticket will sit alongside it.

Tested against Paperclip v0.3.0, OpenClaw gateway protocol v3, on macOS 15.
