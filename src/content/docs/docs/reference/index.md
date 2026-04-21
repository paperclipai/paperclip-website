---
title: Reference
description: The exhaustive technical surface — APIs, CLI, config.
template: doc
---

Reference is **information-oriented**. It describes the machinery accurately and dryly: endpoints, flags, schemas, defaults. Use it to look things up, not to learn.

## What lives here

- REST API endpoints (`/api/...`)
- CLI commands and flags for `paperclipai`
- Skill manifest schema
- Agent `adapterConfig` fields

## Coming soon

Reference is being generated from the Paperclip server's TypeScript types and the CLI source, so it stays in lockstep with the code. Until then, the authoritative references are:

- The Paperclip heartbeat skill shipped with each install
- The `paperclipai` CLI `--help` output

```bash
paperclipai --help
paperclipai issue create --help
```

New to Paperclip? Start with a [Tutorial](/docs/tutorials/) instead.
