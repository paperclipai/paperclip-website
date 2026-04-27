# budget-patterns

Companion example for the W3.1 blog post, [Setting agent budgets and making them stick](https://paperclip.ing/blog/setting-agent-budgets-that-stick/).

A two-agent Paperclip company that demonstrates the four-layer budget pattern:

1. **Per-agent monthly cap** — a hard `$50/month` ceiling stored on each agent record.
2. **80% triage rule** — at 80% of the cap, the agent only accepts `priority="critical"` work.
3. **`request_board_approval` cap-raise** — the agent never raises its own cap; it asks the board.
4. **Auto-pause** — at 100%, Paperclip pauses the agent. The first three layers exist so this layer is rarely the one that fires.

## Layout

```
budget-patterns/
├── .paperclip.yaml          # company schema + per-agent caps
├── agents/
│   ├── ceo/AGENTS.md        # CEO agent prompt with the triage rule
│   └── coder/AGENTS.md      # Coder agent prompt with the triage rule
├── scripts/
│   ├── set-monthly-cap.sh   # PATCH /api/agents/:id with budgetMonthlyCents
│   ├── request-cap-raise.sh # POST /api/companies/:id/approvals
│   ├── triage.sh            # decision logic — accept / defer / escalate / paused
│   └── verify.sh            # bash test harness for triage.sh
└── fixtures/                # sample budget + issue payloads (see below)
```

## Run the verification fixture

```
./scripts/verify.sh
```

Sample output:

```
  ok   spent=1500 budget=5000 priority=medium   -> accept
  ok   spent=1500 budget=5000 priority=critical -> accept
  ok   spent=3950 budget=5000 priority=medium   -> accept
  ok   spent=4000 budget=5000 priority=medium   -> defer
  ok   spent=4250 budget=5000 priority=medium   -> defer
  ok   spent=4250 budget=5000 priority=critical -> accept
  ok   spent=4750 budget=5000 priority=high     -> escalate
  ok   spent=4750 budget=5000 priority=critical -> accept
  ok   spent=5000 budget=5000 priority=critical -> paused
  ok   spent=5100 budget=5000 priority=critical -> paused

results: 10 passed, 0 failed
```

The two cases that matter most are the `4250 5000 medium -> defer` and `4250 5000 critical -> accept` rows. They are the executable form of the headline claim from the blog: **near the cap, non-critical work is refused.**

## Set a real cap on a real agent

```bash
export PAPERCLIP_API_URL=...
export PAPERCLIP_API_KEY=...
export AGENT_ID=...

# $50/month cap
./scripts/set-monthly-cap.sh 5000
```

## Request a cap raise

When critical work is being held back by the cap, the agent does **not** raise its own cap. It opens a `request_board_approval`:

```bash
export PAPERCLIP_API_URL=...
export PAPERCLIP_API_KEY=...
export PAPERCLIP_COMPANY_ID=...
export AGENT_ID=...
export ISSUE_ID=...

./scripts/request-cap-raise.sh
```

The approval lands on the board user's dashboard. When they approve or deny, Paperclip wakes the requester with `PAPERCLIP_APPROVAL_ID` so the agent can act on the answer.

## Why this is the shape

Every layer is doing different work:

- The cap is the **ceiling**.
- The triage rule is the **behavior change** that makes hitting the ceiling a rare event.
- The approval is the **authority boundary** — agents do not move the ceiling on their own.
- The auto-pause is the **last-resort safety net** when something has gone wrong upstream.

If the auto-pause is the layer that keeps firing every month, the upstream layers are wrong. The fix is almost never "raise the cap" — it's "look at the triage rule, look at the wake shape, find the loop."

Tested against Paperclip v0.3.0.
