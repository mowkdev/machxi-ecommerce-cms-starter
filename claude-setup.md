# Claude Code Setup — Complete Implementation

> Paste this entire file into Claude Code, or run: `claude < claude-setup.md`
>
> This prompt is self-contained. It reads existing files, creates all missing
> configuration, and verifies each step. Safe to re-run — all writes are
> idempotent or merge-safe.

---

## Context

You are working in a Turborepo monorepo called `machxi-ecommerce-cms-starter`.
It has two apps:
- `apps/backend` — Medusa v2 eCommerce backend (`@dtc/backend`)
- `apps/storefront` — Next.js 15 + PayloadCMS v3 storefront (`@dtc/storefront`)

Package manager: pnpm. Build tool: Turborepo.
Databases: two PostgreSQL instances (one per app), both wired as MCP servers.
Shell: bash (via Git Bash or WSL) and Node.js are both available.

Before writing any file, read the file at its target path. If it exists, merge
your content rather than overwriting — preserve any existing content that is
not being replaced. If it does not exist, create it.

---

## Phase 1 — CLAUDE.md Files

### Task 1.1 — Root CLAUDE.md

Read the file `CLAUDE.md` at the repo root. If it does not exist, create it
with exactly this content:

```
# machxi-ecommerce-cms-starter

Turborepo + pnpm monorepo. Two apps, two PostgreSQL databases, shared config.

## Monorepo structure

- `apps/backend/`   — Medusa v2 backend (@dtc/backend). REST API, admin UI.
- `apps/storefront/` — Next.js 15 + PayloadCMS v3 storefront (@dtc/storefront).
- `scripts/`        — MCP bootstrap scripts (postgres.mjs, payload.mjs).
- `docker/`         — Docker compose for local DB and services.

## Dev commands (run from repo root)

- `pnpm backend:dev`    — Start Medusa backend only (port 9000)
- `pnpm storefront:dev` — Start Next.js + Payload storefront only (port 3000)
- `pnpm dev`            — Start both apps concurrently
- `pnpm backend:seed`   — Seed Medusa database with demo data
- `pnpm build`          — Build all apps
- `pnpm lint`           — Lint all apps via Turbo

## Backend (Medusa v2) conventions

- Module system only — never import from deprecated v1 paths.
- Custom modules: `apps/backend/src/modules/`
- API routes:     `apps/backend/src/api/`
- Workflows:      `apps/backend/src/workflows/`
- Subscribers:    `apps/backend/src/subscribers/`
- Admin UI:       `apps/backend/src/admin/`
- DB migrations:  `cd apps/backend && pnpm medusa db:migrate`
- Test commands:
  - Unit:        `pnpm test:unit` (in apps/backend)
  - Integration: `pnpm test:integration:http` or `test:integration:modules`

## Storefront (Next.js 15 + PayloadCMS v3) conventions

- PayloadCMS collections: `apps/storefront/src/collections/`
- PayloadCMS config:      `apps/storefront/src/payload.config.ts`
- Next.js app router:     `apps/storefront/src/app/`
- UI components:          `apps/storefront/src/components/`
- Medusa SDK calls:       `apps/storefront/src/lib/`
- Styles:                 Tailwind CSS + class-variance-authority (CVA)
- UI primitives:          Radix UI
- Rich text:              Lexical (PayloadCMS built-in)
- Media storage:          S3-compatible (configured in payload.config.ts)

## Databases

- Medusa DB:  `DATABASE_URL` in `apps/backend/.env`
- Payload DB: `PAYLOAD_DATABASE_URL` in `apps/storefront/.env.local`
- Both have dedicated MCP servers (postgres-medusa, postgres-payload).
- Never run raw DROP or TRUNCATE without explicit user confirmation.

## MCP servers available in this session

- `context7`        — Library documentation lookup
- `chrome-devtools` — Browser DevTools access
- `postgres-medusa` — Direct SQL access to Medusa database
- `postgres-payload` — Direct SQL access to Payload database
- `payload`         — PayloadCMS Local API

## Code style

- TypeScript strict mode throughout — no `any` without a comment explaining why.
- pnpm only — never use npm or yarn commands.
- Imports: use path aliases (`@/`) in storefront, relative imports in backend.
- No barrel files (`index.ts` re-exports) in backend modules.

## Git workflow

- Default branch: main
- Feature branches: `feature/<name>`, fix branches: `fix/<name>`
- Commit format: conventional commits (`feat:`, `fix:`, `chore:`, etc.)
- Never force-push to main. Never reset --hard without confirming with user.
```

### Task 1.2 — Backend CLAUDE.md

Read `apps/backend/CLAUDE.md`. If it does not exist, create it with:

```
@../../CLAUDE.md

# Backend app — Medusa v2 specifics

## File layout

src/
  admin/        Admin UI extensions (React, uses @medusajs/ui components)
  api/          REST API route handlers
  jobs/         Scheduled jobs
  links/        Module link definitions
  migration-scripts/  One-off data migration scripts
  modules/      Custom Medusa modules
  subscribers/  Event subscribers
  utils/        Shared backend utilities
  workflows/    Medusa workflow definitions

## Module authoring rules

1. Every module needs an `index.ts` exporting the module definition.
2. Services must extend `MedusaService` or implement the correct interface.
3. Use `@InjectManager` / `@MedusaContext` decorators for DB access.
4. Workflows compose steps — never put business logic directly in API routes.
5. Subscribers listen to events — keep them thin, delegate to workflows.

## Common mistakes to avoid

- Do NOT import from `@medusajs/medusa/dist/*` (v1 internals).
- Do NOT use `req.scope.resolve()` in new code — use proper DI.
- Do NOT commit migration files without running them locally first.
- Do NOT use `any` in workflow input/output types.

## Running the backend locally

cd apps/backend
pnpm dev          # starts medusa develop with hot reload on port 9000
pnpm db:migrate   # run pending migrations

Admin dashboard: http://localhost:9000/app
API base:        http://localhost:9000
```

### Task 1.3 — Update Storefront AGENTS.md

Read `apps/storefront/AGENTS.md`. Replace its entire contents with:

```
<!-- BEGIN:nextjs-agent-rules -->

# Storefront — Next.js 15 + PayloadCMS v3

## ALWAYS do before any Next.js work

Before writing any Next.js code, find and read the relevant doc in
`node_modules/next/dist/docs/`. Training data is outdated — the installed
docs are the source of truth.

## Next.js 15 App Router rules

- Use Server Components by default. Add `"use client"` only when you need
  browser APIs, event handlers, or React hooks.
- Data fetching: `fetch()` in Server Components with `next: { revalidate }`.
  Never use `getServerSideProps` or `getStaticProps` (Pages Router, not used here).
- Route handlers live in `src/app/api/**/route.ts`.
- Dynamic segments: `[slug]`, catch-all: `[...slug]`, optional: `[[...slug]]`.

## PayloadCMS v3 rules

- Collections are defined in `src/collections/`. Register them in `src/payload.config.ts`.
- Access control: every collection needs explicit `read`, `create`, `update`, `delete` access.
- Hooks run server-side only — no browser APIs.
- Use `payload.find()`, `payload.create()`, etc. from the Local API in Server Components.
  Never call the REST API from within the same process.
- Rich text fields use Lexical. Do not use Slate config.

## Styling rules

- Tailwind CSS utility classes only — no inline styles, no CSS modules.
- Component variants: use `class-variance-authority` (CVA).
- UI primitives: Radix UI — always build on Radix, never roll custom dialogs/selects.
- Animations: Framer Motion for complex, Tailwind transitions for simple.

## Medusa SDK usage

- Import from `@medusajs/js-sdk` only.
- SDK client is initialized in `src/lib/` — import from there, never instantiate inline.
- Cart and customer state: use Medusa's built-in session handling.

<!-- END:nextjs-agent-rules -->
```

---

## Phase 2 — Hooks

### Task 2.1 — Create hook scripts directory

Run: `mkdir -p .claude/hooks`

### Task 2.2 — Block-destructive hook (Node.js, cross-platform)

Create `.claude/hooks/block-destructive.mjs` with:

```javascript
#!/usr/bin/env node
/**
 * Claude Code PreToolUse hook — blocks destructive shell commands.
 * Exit code 2 = block the action and show the error message.
 * Exit code 0 = allow the action.
 */

import { readFileSync } from 'fs';

let input = '';
try {
  input = readFileSync('/dev/stdin', 'utf8');
} catch {
  // stdin not available (e.g. Windows without WSL) — allow by default
  process.exit(0);
}

let event;
try {
  event = JSON.parse(input);
} catch {
  process.exit(0);
}

const command = event?.tool_input?.command || '';

const BLOCKED_PATTERNS = [
  /git\s+push\s+.*--force/,
  /git\s+push\s+-f\b/,
  /git\s+reset\s+--hard/,
  /git\s+clean\s+.*-f/,
  /rm\s+-rf\s+\//,
  /rm\s+-rf\s+\./,
  /rm\s+-rf\s+~\//, 
  /DROP\s+TABLE/i,
  /DROP\s+DATABASE/i,
  /TRUNCATE\s+TABLE/i,
  /DELETE\s+FROM\s+\w+\s*;?\s*$/i,  // DELETE without WHERE
];

const matched = BLOCKED_PATTERNS.find(p => p.test(command));
if (matched) {
  console.error(`[hook] BLOCKED: destructive command detected.`);
  console.error(`[hook] Command: ${command.slice(0, 200)}`);
  console.error(`[hook] Pattern: ${matched}`);
  console.error(`[hook] If this is intentional, run the command directly in your terminal.`);
  process.exit(2);
}

process.exit(0);
```

### Task 2.3 — TypeScript lint hook (Node.js, cross-platform)

Create `.claude/hooks/ts-check.mjs` with:

```javascript
#!/usr/bin/env node
/**
 * Claude Code PostToolUse hook — runs tsc --noEmit after .ts/.tsx edits.
 * Only fires when the edited file is TypeScript.
 * Non-blocking (exit 0 even on type errors) — errors are shown as warnings.
 */

import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { resolve, dirname } from 'path';

let input = '';
try {
  input = readFileSync('/dev/stdin', 'utf8');
} catch {
  process.exit(0);
}

let event;
try {
  event = JSON.parse(input);
} catch {
  process.exit(0);
}

const filePath = event?.tool_input?.file_path || event?.tool_input?.path || '';

// Only run on TypeScript files
if (!/\.(ts|tsx)$/.test(filePath)) {
  process.exit(0);
}

// Determine which app the file belongs to
const isBackend = filePath.includes('apps/backend') || filePath.includes('apps\\backend');
const isStorefront = filePath.includes('apps/storefront') || filePath.includes('apps\\storefront');

if (!isBackend && !isStorefront) {
  process.exit(0);
}

const cwd = isBackend
  ? resolve(process.cwd(), 'apps/backend')
  : resolve(process.cwd(), 'apps/storefront');

try {
  const result = execSync('npx tsc --noEmit --skipLibCheck 2>&1', {
    cwd,
    timeout: 20000,
    encoding: 'utf8',
  });
  if (result.trim()) {
    console.log('[ts-check] Type warnings:\n' + result.slice(0, 1500));
  }
} catch (err) {
  // tsc exits non-zero on type errors — show first 20 lines, don't block
  const output = (err.stdout || err.message || '').split('\n').slice(0, 20).join('\n');
  console.log('[ts-check] Type errors found:\n' + output);
}

process.exit(0);
```

### Task 2.4 — Add hooks to .claude/settings.json

Read `.claude/settings.json`. It currently has the `enabledPlugins` object.
Merge the following `hooks` key into it, preserving `enabledPlugins` exactly as-is.
The result must be valid JSON:

```json
{
  "enabledPlugins": {
    "frontend-design@claude-plugins-official": true,
    "superpowers@claude-plugins-official": true,
    "claude-code-setup@claude-plugins-official": true,
    "ecommerce-storefront@medusa": true,
    "learn-medusa@medusa": true,
    "medusa-dev@medusa": true,
    "payload@payload-marketplace": true,
    "javascript-typescript@claude-code-workflows": true,
    "comprehensive-review@claude-code-workflows": true,
    "backend-development@claude-code-workflows": true,
    "security-scanning@claude-code-workflows": true,
    "full-stack-orchestration@claude-code-workflows": true,
    "conductor@claude-code-workflows": true,
    "agent-teams@claude-code-workflows": true,
    "payment-processing@claude-code-workflows": true,
    "database-design@claude-code-workflows": true,
    "database-migrations@claude-code-workflows": true,
    "unit-testing@claude-code-workflows": true,
    "tdd-workflows@claude-code-workflows": true,
    "application-performance@claude-code-workflows": true
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/block-destructive.mjs",
            "timeout": 5000
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/ts-check.mjs",
            "timeout": 25000,
            "statusMessage": "Checking TypeScript..."
          }
        ]
      }
    ]
  }
}
```

IMPORTANT: Read the actual current contents of `.claude/settings.json` first.
If the `enabledPlugins` object has changed since the above snapshot (new plugins
may have been added), preserve those changes. Only add the `hooks` key.

---

## Phase 3 — Custom Subagents

Run: `mkdir -p .claude/agents`

### Task 3.1 — Medusa backend reviewer agent

Create `.claude/agents/medusa-reviewer.md` with:

```markdown
---
name: medusa-reviewer
description: Use when reviewing Medusa v2 backend code — modules, workflows, API routes, subscribers, and DB migrations. Checks for correct v2 module patterns, proper dependency injection, workflow composition, and migration safety.
tools: Read, Glob, Grep
model: claude-sonnet-4-6
maxTurns: 15
---

You are a Medusa v2 backend expert and code reviewer. You have deep knowledge
of the Medusa v2 module system, workflow engine, event bus, and admin SDK.

## What to check

**Module correctness**
- Service classes must extend `MedusaService` or implement the correct interface
- Use `@InjectManager()` for database access, never raw TypeORM repositories
- Module `index.ts` must export `Module(MODULE_NAME, { service: MyService })`
- No imports from `@medusajs/medusa/dist/*` (v1 internals — breaking)

**Workflow composition**
- Workflows must use `createWorkflow()` + `createStep()`
- Steps must declare `input` and `output` with Zod schemas
- Compensation functions required for any step with side effects
- Never put raw business logic in API route handlers — delegate to workflows

**API routes**
- Route files: `src/api/<scope>/[resource]/route.ts`
- Must call `validateBody()` or `validateQuery()` on input
- Async errors must be caught or the route wrapped in a try/catch
- Auth middleware applied via `authenticate()` from `@medusajs/framework/http`

**Database migrations**
- Every new entity needs a migration
- Migrations must be reversible (`down()` method implemented)
- No dropping columns without a data migration plan
- Check for missing indexes on foreign keys

**Event subscribers**
- Subscribers should be thin — parse event, call a workflow, return
- No database access directly in subscriber — use workflow steps

## Output format

For each issue found, state:
1. File path and line number (or range)
2. Severity: CRITICAL / WARNING / SUGGESTION
3. What is wrong
4. How to fix it

Group by severity. Be concise and specific. Skip compliments.
```

### Task 3.2 — PayloadCMS reviewer agent

Create `.claude/agents/payload-reviewer.md` with:

```markdown
---
name: payload-reviewer
description: Use when reviewing PayloadCMS v3 collection definitions, access control rules, hooks, field configurations, and the payload.config.ts. Catches missing access control, hook ordering issues, field validation gaps, and Lexical config mistakes.
tools: Read, Glob, Grep
model: claude-sonnet-4-6
maxTurns: 12
---

You are a PayloadCMS v3 expert and code reviewer. You have deep knowledge of
the collection API, access control system, hooks lifecycle, Lexical richtext,
and the Local API.

## What to check

**Access control**
- Every collection needs explicit `read`, `create`, `update`, `delete` functions
- `read: () => true` on sensitive collections (users, orders) is a CRITICAL issue
- Admin-only operations must check `req.user?.role === 'admin'` or similar
- Field-level access control for sensitive fields (passwords, tokens, PII)

**Collection hooks**
- `beforeChange` hooks that throw will prevent saves — ensure errors are handled
- `afterChange` hooks run after DB commit — side effects here are acceptable
- `beforeRead` can transform data — watch for performance (N+1 on lists)
- Hook execution order: beforeValidate → beforeChange → afterChange → afterRead

**Field configuration**
- Required fields should have `required: true` — don't rely on DB constraints alone
- Relationship fields need `relationTo` pointing to an existing collection slug
- Upload fields: check `mimeTypes` and `maxFileSize` are set
- Lexical richtext: verify `features` array includes only installed feature imports

**PayloadCMS config (payload.config.ts)**
- All collections must be registered in `collections: []`
- `serverURL` must be set for media URLs to resolve correctly
- S3 storage adapter: check `bucket`, `region`, `acl` are configured
- `secret` must come from env var, never hardcoded

**Local API usage in Next.js**
- Always `await getPayload({ config })` — never use the REST API from Server Components
- `payload.find()` returns `{ docs, totalDocs, ... }` — destructure correctly
- Draft documents require `draft: true` in find options

## Output format

For each issue:
1. File path (and field/collection name)
2. Severity: CRITICAL / WARNING / SUGGESTION
3. What is wrong and why it matters
4. Exact fix

Group by severity. Skip compliments.
```

### Task 3.3 — Full-stack feature coordinator agent

Create `.claude/agents/feature-coordinator.md` with:

```markdown
---
name: feature-coordinator
description: Use when implementing a new feature that spans both the Medusa backend and the Next.js/Payload storefront. Coordinates the implementation sequence, identifies all touch points, and delegates to the right specialists.
tools: Read, Glob, Grep, Bash
model: claude-opus-4-6
maxTurns: 20
---

You are a lead full-stack architect for a Medusa v2 + Next.js 15 + PayloadCMS v3
e-commerce platform. You coordinate feature implementation across both apps.

## Your process for any new feature

1. **Scope mapping** — Identify every file that needs to change:
   - Backend: modules, workflows, API routes, subscribers, migrations
   - Storefront: collections (if CMS content needed), components, API calls, pages

2. **Dependency order** — Always implement in this sequence:
   a. DB migration (if schema changes)
   b. Medusa module + service
   c. Medusa workflow
   d. Medusa API route
   e. PayloadCMS collection (if needed)
   f. Storefront data fetching (lib/)
   g. Storefront UI components
   h. Storefront pages/routes

3. **Contract definition** — Before writing any code, define:
   - API request/response shapes (TypeScript interfaces)
   - Medusa workflow input/output Zod schemas
   - PayloadCMS field types (if applicable)

4. **Handoff summary** — After each phase, summarize:
   - What was implemented
   - What the next phase must consume
   - Any open questions for the user

## Rules

- Never skip the migration step if schema changes are needed
- Always add access control to new API routes
- TypeScript strict — no `any` without justification
- Test the happy path description before handing back to the user

When in doubt about Medusa v2 specifics, delegate to `medusa-reviewer`.
When in doubt about PayloadCMS specifics, delegate to `payload-reviewer`.
```

---

## Phase 4 — Custom Skills

Run: `mkdir -p .claude/skills`

### Task 4.1 — PR summary skill

Create `.claude/skills/pr-summary.md` with:

```markdown
---
name: pr-summary
description: Generate a structured pull request description from the current git diff against main
---

## Current branch
!`git branch --show-current`

## Diff statistics
!`git diff main --stat 2>/dev/null || git diff origin/main --stat 2>/dev/null`

## Changed files
!`git diff main --name-only 2>/dev/null || git diff origin/main --name-only 2>/dev/null`

## Full diff (truncated to relevant sections)
!`git diff main 2>/dev/null | head -500 || git diff origin/main 2>/dev/null | head -500`

---

Write a pull request description with these sections:

**## Summary**
One paragraph — what this PR does and why.

**## Changes**
Bullet list grouped by area (backend, storefront, config, etc.).
Be specific: file names and what changed in each.

**## Migration required**
Yes/No. If yes, describe what the migration does.

**## Testing**
How to verify this change works locally. Include any seed data or env vars needed.

**## Breaking changes**
List any breaking changes, or write "None".
```

### Task 4.2 — Seed database skill

Create `.claude/skills/seed.md` with:

```markdown
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
```

### Task 4.3 — Dev status check skill

Create `.claude/skills/dev-check.md` with:

```markdown
---
name: dev-check
description: Check whether the backend and storefront dev servers are running, show recent errors from each, and verify database connectivity
---

## Process check
!`pnpm --version && node --version`

## Backend health
!`curl -s -o /dev/null -w "%{http_code}" http://localhost:9000/health 2>/dev/null || echo "not running"`

## Storefront health
!`curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "not running"`

## Git status
!`git status --short`

## Recent TypeScript errors (backend)
!`cd apps/backend && npx tsc --noEmit --skipLibCheck 2>&1 | head -30 || echo "No TS errors"`

## Recent TypeScript errors (storefront)
!`cd apps/storefront && npx tsc --noEmit --skipLibCheck 2>&1 | head -30 || echo "No TS errors"`

---

Summarize the dev environment status:
- Are both servers running? (Yes/No)
- Any TypeScript errors? List the first 5 if present.
- Any uncommitted changes worth flagging?

Keep the summary under 15 lines.
```

### Task 4.4 — Migration skill

Create `.claude/skills/migrate.md` with:

```markdown
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
```

---

## Phase 5 — MCP Server Addition

### Task 5.1 — Add GitHub MCP server

Read `.mcp.json`. It currently has: context7, chrome-devtools, postgres-medusa,
postgres-payload, payload.

Add a `github` server entry. The final `.mcp.json` must contain all existing
servers PLUS:

```json
"github": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-github"],
  "env": {
    "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"
  }
}
```

Note: The token uses an env var reference. Tell the user after writing the file:
"Add `GITHUB_PERSONAL_ACCESS_TOKEN=<your-token>` to your shell profile or a
`.env` file that is gitignored, then restart Claude Code for the GitHub MCP
server to authenticate."

---

## Phase 6 — Verification

After completing all tasks above, run these verification checks:

### Check 1 — File existence
Verify all of the following files exist. List any that are missing:

```
CLAUDE.md
apps/backend/CLAUDE.md
apps/storefront/AGENTS.md
.claude/settings.json
.claude/hooks/block-destructive.mjs
.claude/hooks/ts-check.mjs
.claude/agents/medusa-reviewer.md
.claude/agents/payload-reviewer.md
.claude/agents/feature-coordinator.md
.claude/skills/pr-summary.md
.claude/skills/seed.md
.claude/skills/dev-check.md
.claude/skills/migrate.md
.mcp.json
```

### Check 2 — JSON validity
Run: `node -e "JSON.parse(require('fs').readFileSync('.claude/settings.json','utf8')); console.log('settings.json: valid')"`
Run: `node -e "JSON.parse(require('fs').readFileSync('.mcp.json','utf8')); console.log('.mcp.json: valid')"`

### Check 3 — Hook syntax
Run: `node --check .claude/hooks/block-destructive.mjs && echo "block-destructive.mjs: OK"`
Run: `node --check .claude/hooks/ts-check.mjs && echo "ts-check.mjs: OK"`

### Check 4 — CLAUDE.md line count
Run: `wc -l CLAUDE.md apps/backend/CLAUDE.md`
Both should be under 150 lines.

### Check 5 — Settings hooks presence
Run: `node -e "const s=JSON.parse(require('fs').readFileSync('.claude/settings.json','utf8')); console.log('hooks keys:', Object.keys(s.hooks||{}))"`
Should output: `hooks keys: [ 'PreToolUse', 'PostToolUse' ]`

---

## Completion Report

After all checks pass, output a completion report in this format:

```
## Setup Complete ✓

### Created files
[list each file created]

### Modified files
[list each file modified]

### Next steps for you
1. Add GITHUB_PERSONAL_ACCESS_TOKEN to your shell environment if you want 
   the GitHub MCP server to authenticate (optional).
2. Restart Claude Code to load the new hooks and agents.
3. Test hooks by running a task that edits a .ts file — you should see 
   "[Checking TypeScript...]" in the status bar.
4. Try /pr-summary, /seed, /dev-check, /migrate as slash commands.
5. Mention @"medusa-reviewer (agent)" or @"payload-reviewer (agent)" in any 
   message to invoke the specialized code reviewers.

### Agents now available
- medusa-reviewer — invoked automatically or via @"medusa-reviewer (agent)"
- payload-reviewer — invoked automatically or via @"payload-reviewer (agent)"
- feature-coordinator — invoke for cross-app feature planning

### Skills (slash commands) now available
- /pr-summary   — Generate PR description from current diff
- /seed         — Seed Medusa database
- /dev-check    — Check dev server and TS error status
- /migrate      — Run Medusa DB migrations
```
