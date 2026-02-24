# Landing Page Copy Ideas (Codex Draft)

## Intent
This is an idea bank, not final copy.  
Goal: help us choose strong, authoritative messaging for founders/operators who want to run multiple AI-agent companies through one control plane.

## Product Reality Snapshot (for copy accuracy)
Use this to avoid overclaiming.

1. Strongly supported now:
- Multi-company control plane in one instance.
- Agent org structure with reporting lines and governance controls.
- Approval flows (`hire_agent`, strategy approval) with comments and revision loops.
- Activity log + auditable mutation history.
- Cost events, budget tracking, and auto-pause when agent budget is exceeded.
- Heartbeat runtime with live run status/logs/events.
- Adapter support: `claude_local`, `codex_local`, `process`, `http`.
- Local-first onboarding and deployment modes (`local_trusted`, `authenticated`).

2. Positioning-supported but should be framed carefully:
- OpenClaw and any external bot can connect via HTTP adapter patterns.
- Bring-your-own runtime via `process`/`http` adapter model.
- Template/import ecosystem language should be framed as roadmap unless implemented in this repo.

3. Do not position as core:
- Code review tool.
- Knowledge base/wiki/vector DB.
- Revenue accounting platform.
- Agent runtime itself.

## Audience Framing
Primary buyer:
- Entrepreneur/operator running multiple AI-led businesses.

Primary anxiety:
- "Can I trust autonomous agents with money, alignment, and execution?"

Primary promise:
- "You can run autonomous companies with real governance, visibility, and cost control."

## Message Pillars
1. Control Plane, Not Chaos
- You are hiring and managing agents like a real company, not prompting a swarm.

2. Governance by Default
- Hiring approvals, board overrides, audit trail, and permissioned actions.

3. Cost and Execution Visibility
- Live activity, heartbeat runs, budget controls, and hard-stop protection.

4. BYO Agents and Runtime
- Use Codex/Claude local adapters now, plug in external bots through process or HTTP.

5. Company-Level Scale
- One instance, many companies. Operator-level oversight across each business.

## H1 Idea Bank
1. Paperclip runs your business.
2. Run AI companies, not AI experiments.
3. The control plane for autonomous companies.
4. Operate a company of agents with real governance.
5. Build an AI workforce. Keep command.

## H2 / Subheadline Ideas
1. Hire a team of AI agents to run your business.
2. Organize agents into real companies with budgets, approvals, and audit trails.
3. One control plane for every agent, task, budget, and decision.
4. Bring your own agents. Keep them aligned to your goals.
5. Launch fast locally, deploy when ready, stay in control the whole time.

## Hero Copy Concepts
### Concept A: Command + Scale
- H1: `Paperclip runs your business.`
- H2: `Hire a team of AI agents to run your business.`
- Support line: `Build multiple AI companies in one control plane with approvals, budgets, and live operational visibility.`
- CTA ideas: `Start with npx paperclip onboard` / `Run your first company`

### Concept B: Governance First
- H1: `Autonomous execution. Human governance.`
- H2: `Paperclip gives you the boardroom controls AI companies need.`
- Support line: `Approve hires, track every action, enforce budgets, and intervene instantly.`
- CTA ideas: `Launch local in minutes` / `See governance model`

### Concept C: BYO Agent Network
- H1: `Hire any bot. Run one company.`
- H2: `Codex, Claude, process jobs, and webhooks in one operating layer.`
- Support line: `Bring your own agent stack and orchestrate work through shared goals, tasks, and approvals.`
- CTA ideas: `Connect your first agent` / `Explore adapters`

## "Hire Any Bot With Ease" Section Ideas
Section headers:
1. Hire any bot with ease.
2. Bring your own agents.
3. Your agent stack, one command layer.

Body options:
1. `Paperclip is adapter-based: run local Codex and Claude agents, shell-based workers, or external webhook agents in the same company.`
2. `Use the agents you already trust. Paperclip standardizes governance, tasking, and visibility across all of them.`
3. `If it can run as a process or accept an HTTP wakeup, it can join your org.`

Micro-proof bullets:
- `First-class local adapters: Codex + Claude`
- `Universal adapters: Process + HTTP`
- `Per-agent runtime config, sessions, and heartbeat history`

## Feature Section Copy Ideas
1. Governance and approvals
- `Board-level approval gates for hiring and strategic actions.`
- `Revision requests and decision trails, not ad hoc chat decisions.`

2. Audit trail
- `Every meaningful mutation is logged with actor, entity, and timestamp.`
- `Trace who changed what, when, and why.`

3. Cost controls
- `Track spend by company, agent, and project context.`
- `Set monthly budgets and auto-pause agents at hard limits.`

4. Goal and task alignment
- `Hierarchical tasks keep agent execution tied to company outcomes.`
- `Single-assignee ownership with conflict-safe checkout semantics.`

5. Context and runtime management
- `Heartbeat execution with resumable sessions and live run visibility.`
- `Reset runtime sessions when agents drift.`

6. Multi-company operations
- `Run multiple companies from one Paperclip instance.`
- `Separate orgs, shared operator control plane.`

7. Deployment simplicity
- `Local-trusted mode for immediate startup.`
- `Authenticated private/public modes when you deploy broadly.`

## "What It Is / What It Isn't" Copy Block
What it is:
- `A control plane for AI-agent companies.`
- `An operating system for agent orgs, governance, and execution oversight.`

What it is not:
- `Not a code review tool.`
- `Not an agent runtime.`
- `Not a wiki/knowledge base product.`
- `Not bookkeeping for external revenue/expenses.`

## Narrative Flow Ideas (Page Structure)
1. Hero
- Bold claim + direct operator outcome + command CTA.

2. Trust frame
- "Autonomy without governance is liability."
- Transition into board controls, approvals, and audit.

3. BYO agent story
- Codex/Claude/process/http examples.
- "Any agent, one control layer."

4. Operating visibility
- Activity, heartbeat, costs, budgets, intervention controls.

5. Multi-company angle
- "One operator, multiple businesses."

6. What it is not
- Reduce category confusion early.

7. Installation + first run
- Primary command path with minimal friction.

8. Final CTA
- Repeat command and operator-level payoff.

## Command / CTA Copy Ideas
Primary CTA text options:
1. `Start now`
2. `Run your first company`
3. `Launch Paperclip locally`
4. `Control your agent workforce`

Command presentation options:
1. `npx paperclip onboard`
2. `npx paperclip onboard && npx paperclip run`
3. `pnpm paperclip run` (developer repo path)

Note: choose one canonical install command based on package publish/distribution status.

## Copy Guardrails
1. Use "control plane" repeatedly and intentionally.
2. Emphasize "company" and "governance" over "chat."
3. Avoid soft startup language like "assistant" or "copilot."
4. Prefer operational verbs: `hire`, `approve`, `assign`, `pause`, `audit`, `deploy`.
5. Be explicit where capability is roadmap vs shipped.

## Options to Distill Next
1. Pick one hero concept (`A`, `B`, or `C`).
2. Pick one tone variant:
- `Operator-hard`: strongest governance/cost posture.
- `Founder-scale`: strongest multi-company growth posture.
- `Builder-flex`: strongest BYO adapter/runtime posture.
3. Pick one canonical install command for all CTAs.
4. Decide if "OpenClaw/Cursor" appears as shipped integrations or ecosystem examples.
