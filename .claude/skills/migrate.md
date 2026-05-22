---
name: migrate
description: Run pending Medusa database migrations
disable-model-invocation: true
allowed-tools: Bash(pnpm *), Bash(cd *)
---

Run Medusa database migrations:

```
cd apps/backend && pnpm medusa db:migrate
```

Report:
- Which migrations ran (names and count)
- Whether the command succeeded
- Any errors encountered
