---
title: "Deploying Paperclip to production on a $20/month VPS"
date: "2026-04-27"
draft: true
excerpt: "We put the Paperclip control plane on a single Hetzner box, with TLS, backups, and login. Here's the walkthrough, the dated cost breakdown, and the three things almost everyone gets wrong on the first try."
author: "Paperclip"
tags: ["pattern", "deployment", "ops", "self-hosted"]
---

The Paperclip control plane is one Node server, one Postgres database, and a persistent data directory. That's it. It will run on a laptop, on a Raspberry Pi, and — the case this post is about — on a small VPS.

We rebuilt our self-host setup from scratch on a fresh Hetzner box to time it and price it. Forty-three minutes from "rented the VPS" to "logged in over HTTPS and assigned my first task." Total monthly cost as of April 2026: about $20, including backups and a domain name. Below is the walkthrough, what each line item costs, and the three failure modes you'll trip over if you wing it.

## What runs where

Before the commands, the architecture, because most "it doesn't work" reports trace back to confusion about this:

- **On the VPS:** the Paperclip server (port 3100, includes the UI), Postgres 17, the data volume (`/paperclip` — skills, secrets, telemetry, run logs), and a reverse proxy fronting it with TLS.
- **Not on the VPS:** the agents. Adapters like `claude_local` and `codex_local` run on operator machines next to the source code they touch. The VPS is the control plane and the audit trail. Trying to colocate agents on the server is the first thing on the list of things you'll get wrong (see below).

This split is the whole reason a $20 VPS is enough. You're hosting coordination, not inference.

## The walkthrough

Specs: Hetzner CPX32 in Germany/Finland (4 vCPU, 8 GB RAM, 160 GB SSD), Ubuntu 24.04, automated backups, and a Hetzner Cloud Firewall allowing inbound 22, 80, and 443 only. Everything below is one shell session as `root` until the last step.

**1. Install Docker + Compose.**

```bash
curl -fsSL https://get.docker.com | sh
apt-get install -y docker-compose-plugin
```

**2. Pull Paperclip.**

```bash
git clone https://github.com/paperclipai/paperclip /opt/paperclip
cd /opt/paperclip/docker
```

The repo ships a `docker-compose.yml` that wires the server, Postgres, and two named volumes (`pgdata`, `paperclip-data`). You don't write this file; you read it once and keep your uncommitted `.env` next to it.

**3. Generate secrets and a public URL.**

```bash
cat > .env <<EOF
BETTER_AUTH_SECRET=$(openssl rand -hex 32)
PAPERCLIP_PUBLIC_URL=https://paperclip.example.com
EOF
```

Point a DNS A record for `paperclip.example.com` at the VPS IP. Wait the thirty seconds for it to propagate.

**4. Reverse proxy with Caddy.**

```bash
cat > /opt/paperclip/Caddyfile <<'EOF'
paperclip.example.com {
  reverse_proxy localhost:3100
}
EOF

docker run -d --name caddy --restart=always \
  --network host \
  -v /opt/paperclip/Caddyfile:/etc/caddy/Caddyfile \
  -v caddy-data:/data \
  caddy:2
```

Caddy gets a Let's Encrypt cert on first request. No flags, no manual ACME setup.

**5. Bring up the stack.**

```bash
docker compose up -d
docker compose logs -f server
```

Wait for `server listening on :3100`. The first start runs migrations against an empty database and emits a one-time **board-claim URL**:

```text
[claim] /board-claim/<token>?code=<code>
```

Visit `https://paperclip.example.com/board-claim/<token>?code=<code>` from a browser, sign up with email/password, and you become the instance admin. The auto-created local board user is demoted in the same transaction.

**6. Connect a local agent.**

On your laptop, install the CLI and point it at the VPS:

```bash
npm install -g @paperclipai/cli
paperclipai agent local-cli devrel \
  --company-id <your-company-id> \
  --api-url https://paperclip.example.com
```

That command exports `PAPERCLIP_API_KEY`, `PAPERCLIP_API_URL`, etc. to your shell. The agent runs locally, talks to the control plane over HTTPS, and the audit trail shows up in the same UI you just signed into.

That's the deploy. File an issue, assign it to the agent, watch the next heartbeat fire.

## Cost breakdown (April 2026)

Numbers are real, dated, and pre-tax for the line items we control. Your taxes will vary.

| Line item | Monthly | Notes |
| --- | --- | --- |
| Hetzner CPX32 (Germany/Finland) | €13.99 / $15.99 | 4 vCPU, 8 GB RAM, 160 GB SSD |
| Hetzner backups (20%) | €2.80 / $3.20 | Daily snapshot, 7-day retention |
| Domain (`example.com`) | ~$1 | Amortized from $12/year at most registrars |
| Cloudflare DNS | $0 | Free tier |
| **Total** | **~$20** | |

What this *doesn't* include: agent inference costs. Those are paid to whoever runs the model — Anthropic, OpenAI, or your own GPUs. Paperclip's per-agent budgets exist precisely because that line item is the one that varies. ([Setting agent budgets that stick](/blog/setting-agent-budgets-that-stick).)

A CPX32 has been comfortable for a five-agent company with daily heartbeats and a few hundred issues. We haven't load-tested it past that. If you push past, it's almost certainly Postgres, not Node, that asks for the next dollar.

## The three things you'll get wrong

These are the failure modes that ate the most time when we ran this in a clean environment.

**1. Trying to run agents on the VPS.** The first instinct is "the server is the natural place to run everything." It isn't. The agent adapter in most setups *is* a Claude Code or Codex CLI process — it needs your local credentials, your dotfiles, your editor, and (often) access to source code that isn't on the VPS. It also wants a real model API key the operator owns. Run agents on the laptop or workstation that has the code and the keys. Run the control plane on the VPS. The control plane is what wants the static IP, the always-on uptime, and the reverse proxy. Agents don't need any of that.

**2. Setting `PAPERCLIP_PUBLIC_URL` to the IP address.** Better Auth uses `PAPERCLIP_PUBLIC_URL` as the canonical origin for cookies, CSRF, and OAuth callbacks. If you set it to `http://1.2.3.4:3100` you'll log in once and hit a redirect loop on every subsequent action. Worse, mixed http/https surfaces produce inconsistent cookie scoping that mostly works in incognito and breaks for everyone else. Use the HTTPS hostname *from the start*. Changing it later after users have started sessions is a "clear all cookies and re-claim the board" recovery.

**3. No backups on the Postgres volume.** A Paperclip database holds run history, comment threads, audit trail, and approvals — basically the entire memory of every agent that's ever worked for you. When the VPS dies (and the eventual one will), the difference between a five-minute outage and a complete restart-from-zero is whether you turned backups on. Hetzner backups at +20% is the laziest correct answer; offsite `pg_dump` on a `cron` to a separate bucket is the slightly less lazy one. Pick one before you assign your first real task. The bug we keep seeing is people deferring backups "until the company is doing real work," which is exactly the moment you can't afford to lose it.

## Reference config

A reference config with the Caddyfile, a production Docker Compose overlay, an env template, and a one-shot bootstrap script lives at [`paperclipai/examples/vps-deploy`](https://github.com/paperclipai/paperclip-website/tree/master/examples/vps-deploy). We rebuild it against each Paperclip release and pin the image tags. Set `PAPERCLIP_DOMAIN`, run `./scripts/bootstrap.sh` from the cloned example, walk away. The walkthrough above is the long-form version of what that script does in fewer keystrokes.

The paired how-to with the exact commands and a per-step troubleshooting table is at [Deploy Paperclip to a VPS](https://docs.paperclip.ing/how-to/deploy-vps/). If you find a step that breaks, open an issue against the example repo — broken first deploys are bugs, not user error.

Tested against Paperclip `v2026.427.0` on Hetzner CPX32, Ubuntu 24.04, Docker 27, Caddy 2.8, in April 2026. Cost numbers are list price as of this date and will drift. The architecture won't.
