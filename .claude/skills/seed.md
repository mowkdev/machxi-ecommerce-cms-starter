---
name: seed
description: Seed the Medusa backend database with demo products, categories, and regions
disable-model-invocation: true
allowed-tools: Bash(pnpm *)
---

Seed the Medusa backend database by running:

```
pnpm backend:seed
```

Wait for completion. Report:
- Whether seeding succeeded or failed
- How many products/categories/regions were created (parse from output if available)
- Any error messages if it failed
