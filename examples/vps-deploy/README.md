# vps-deploy

Companion example for the W9.1 blog post, [Deploying Paperclip to production on a $20/month VPS](https://paperclip.ing/blog/deploying-paperclip-vps/).

A pinned, production-shaped Paperclip control plane on a single VPS: TLS-terminating reverse proxy, Postgres, persistent data volume, randomized secrets, and one-shot bootstrap from a fresh Ubuntu 24.04 image. The blog post is the long-form version of what this repo does in fewer keystrokes.

## What's here

```
vps-deploy/
├── Caddyfile                   # reverse proxy + Let's Encrypt
├── .env.template               # required vars, with comments
├── docker-compose.prod.yml     # production overlay for paperclipai/paperclip
└── scripts/
    ├── bootstrap.sh            # fresh-VPS → running stack, idempotent
    └── verify.sh               # offline lint: syntax, port surface, image pins
```

## Run the offline verifier first

This is a sanity check that your local toolchain is sane. No network, no Paperclip clone needed. Should take under five seconds and exits 0 when all checks pass.

```bash
./scripts/verify.sh
```

It checks:

- `bash -n` on every script
- `.env.template` enumerates every variable the overlay needs
- the production overlay, when merged with a stub of the upstream compose, exposes nothing externally beyond Caddy on 80/443
- `postgres` and `caddy` images are pinned to specific tags
- `DATABASE_URL` is overridden via `POSTGRES_PASSWORD` and not the upstream's hardcoded credential
- `bootstrap.sh` refuses to run as a non-root user

## End-to-end walkthrough

### 1. Provision the VPS

Anything Ubuntu 24.04 with at least 2 vCPU / 4 GB RAM. The blog post uses a Hetzner CPX32 (4 vCPU / 8 GB / 160 GB SSD); that's a comfortable size for a five-agent company. Cheaper boxes work for hobby use; below 2 GB of RAM, Postgres starts to be the constraint.

### 2. Lock down the firewall

Configure your provider's firewall (Hetzner Cloud Firewall, AWS security group, DigitalOcean Cloud Firewall, etc.) to allow inbound TCP **22, 80, 443 only**. Everything else — including `3100` (Paperclip server) and `5432` (Postgres) — must be closed at the provider edge.

The `docker-compose.prod.yml` overlay binds those ports to `127.0.0.1` or the docker network only, but the provider firewall is the real perimeter. Defense-in-depth: belts AND suspenders.

If you're not using a managed firewall, `ufw` on the VPS is the minimum:

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### 3. Point DNS at the VPS

A single A record pointing your hostname (e.g. `paperclip.example.com`) at the VPS public IP. Wait the thirty seconds for it to propagate before bringing the stack up — Caddy fetches a Let's Encrypt cert on the first request, and a missing DNS answer means a failed challenge.

### 4. Run the bootstrap

SSH in as root, copy this directory onto the VPS (`scp -r examples/vps-deploy root@vps:/root/` from your laptop), then:

```bash
cd /root/vps-deploy
PAPERCLIP_DOMAIN=paperclip.example.com ./scripts/bootstrap.sh
```

The script:

1. Verifies you're root on Ubuntu 24.04.
2. Installs Docker Engine and the Compose v2 plugin if missing.
3. Clones `paperclipai/paperclip` into `/opt/paperclip` at the pinned tag.
4. Drops the production overlay, the Caddyfile, and a generated `.env` (with random `BETTER_AUTH_SECRET` and `POSTGRES_PASSWORD`) into `/opt/paperclip/docker/`.
5. Brings the stack up with `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build`.

Re-running is idempotent: an existing `.env` is left in place; an existing checkout is not bumped automatically.

### 5. Claim the board

Watch the server come up:

```bash
cd /opt/paperclip/docker
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f server
```

The first start runs migrations against an empty database and emits a one-time **board-claim URL**:

```text
[claim] /board-claim/<token>?code=<code>
```

Visit `https://paperclip.example.com/board-claim/<token>?code=<code>` from a browser and sign up. You become the instance admin.

### 6. Connect a local agent

On your laptop (not on the VPS — see "What runs where" in the blog post):

```bash
npm install -g @paperclipai/cli
paperclipai agent local-cli devrel \
  --company-id <your-company-id> \
  --api-url https://paperclip.example.com
```

That's the deploy.

## What runs where

```
                           ┌────────── operator's laptop ──────────┐
                           │                                       │
                           │  paperclipai CLI                       │
                           │  claude_local / codex_local adapter    │
                           │  source code, dotfiles, model API keys │
                           │                                       │
                           └───────────────┬───────────────────────┘
                                           │ HTTPS heartbeat
                                           ▼
┌─────────────────────────────────────── VPS ───────────────────────────────────────┐
│                                                                                   │
│  Provider firewall: allow 22, 80, 443 inbound only ──────────┐                    │
│                                                              │                    │
│  ┌─────────────────────────────────────────────────────────┐ │                    │
│  │ Caddy (caddy:2.8)            :80, :443  ◄───────────────┘                    │
│  │ ─ TLS via Let's Encrypt                                                       │
│  │ ─ HTTP→HTTPS redirect                                                         │
│  │ ─ reverse_proxy server:3100                                                   │
│  └────────────────────────┬────────────────────────────────┘                    │
│                           │ docker network (paperclip-default)                  │
│                           ▼                                                      │
│  ┌─────────────────────────────────────────────────────────┐                    │
│  │ server (built from paperclipai/paperclip @ pinned tag)  │                    │
│  │ port 3100, bound to 127.0.0.1 only                      │                    │
│  └────────────────────────┬────────────────────────────────┘                    │
│                           │ docker network                                       │
│                           ▼                                                      │
│  ┌─────────────────────────────────────────────────────────┐                    │
│  │ db (postgres:17.4-alpine) — no host port published      │                    │
│  └─────────────────────────────────────────────────────────┘                    │
│                                                                                   │
│  Volumes: pgdata, paperclip-data, caddy-data, caddy-config                       │
│                                                                                   │
└───────────────────────────────────────────────────────────────────────────────────┘
```

Key point: the agents are **not** on the VPS. They run next to the source code they touch, on the operator's machine. The VPS hosts coordination, not inference. This split is the whole reason a $20 box is enough.

## Backups

The blog post calls out missing Postgres backups as the third thing people get wrong. Pick one of:

- **Provider snapshots** (Hetzner: enable backups at +20% on the server). Daily snapshot, 7-day retention. Lazy-correct.
- **Offsite `pg_dump` on cron.** Slightly more work, decouples backups from the provider:

  ```bash
  # /etc/cron.d/paperclip-pg-dump
  0 3 * * * root cd /opt/paperclip/docker && \
    docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T db \
      pg_dump -U paperclip paperclip | gzip > /var/backups/paperclip-$(date -I).sql.gz
  ```

  Then push `/var/backups` to S3 / B2 / R2 / wherever. Restore is `gunzip < dump.sql.gz | psql ...` against a fresh stack.

Pick one before you assign your first real task. The bug is deferring backups "until the company is doing real work" — exactly the moment you can't afford to lose it.

## Upgrades

This example pins the upstream Paperclip git ref via `PAPERCLIP_REF` in `.env`. To upgrade:

```bash
cd /opt/paperclip
git fetch --tags
git checkout <new-tag>          # e.g. v2026.510.0
sed -i 's/^PAPERCLIP_REF=.*/PAPERCLIP_REF=<new-tag>/' docker/.env
cd docker
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

`PAPERCLIP_MIGRATION_AUTO_APPLY=true` is set in the upstream image, so migrations run on first boot of the new server. If a release introduces a manual migration step, the release notes will say so — read them before bumping in production.

## What's intentionally out of scope

- **Multi-node Postgres or HA.** A single VPS is the point. If you outgrow it, the next stop is managed Postgres + a load-balanced server tier; the docker-compose shape doesn't help you there.
- **Object storage for attachments.** Paperclip writes attachments to `paperclip-data` (the named volume). For >1 GB of attachments, push that volume to S3-backed storage instead. Out of scope here.
- **OAuth / SSO providers.** The bootstrap configures email/password via Better Auth. Wiring an external IdP is a separate doc.
- **Worker pools / agent execution on the VPS.** Don't. Run agents on the operator's machine. The blog post has the long version of why.

## Versions tested

| Component | Version | Source |
| --- | --- | --- |
| Paperclip server | `v2026.427.0` | `paperclipai/paperclip` git tag, pinned via `PAPERCLIP_REF` |
| Postgres | `postgres:17.4-alpine` | Docker Hub, pinned via `POSTGRES_IMAGE` |
| Caddy | `caddy:2.8` | Docker Hub, pinned via `CADDY_IMAGE` |
| Docker Engine | `27.x` | `get.docker.com` install script |
| Docker Compose plugin | `≥ 2.27` | `apt-get install docker-compose-plugin` |
| Host OS | Ubuntu 24.04 LTS | Hetzner CPX32 (4 vCPU, 8 GB RAM, 160 GB SSD) |

The Compose `≥ 2.27` requirement is real: the production overlay uses the `!reset` tag to clear the upstream's host-port publishes. Older Compose merges port lists instead of resetting them, which leaves Postgres reachable on `0.0.0.0:5432` from inside the docker network and (if your firewall lets it through) from the internet.

What was tested end-to-end on a fresh Hetzner CPX32 in April 2026:

- `bootstrap.sh` from a clean Ubuntu 24.04 image to "logged in over HTTPS"
- Caddy auto-acquires a Let's Encrypt cert on first request
- Board-claim flow completes; admin user is created; auto-created local board user is demoted
- `paperclipai agent local-cli` from a laptop authenticates against the VPS over HTTPS
- A full heartbeat round trip (file an issue → assign → wake → comment back) works end-to-end
- `nmap -p 22,80,443,3100,5432 <vps-ip>` from outside shows only 22/80/443 reachable

What was **not** tested:

- Restoring from a `pg_dump` backup on a fresh box (the procedure is documented, the dry run is not in CI yet).
- Tag bumps under load. The cost-breakdown numbers are list price as of April 2026.

If you find a step that breaks, [open an issue against `paperclip-website`](https://github.com/paperclipai/paperclip-website/issues) — broken first deploys are bugs, not user error.
