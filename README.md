# MachXI Ecommerce CMS Starter

A monorepo starter for direct-to-consumer ecommerce: Medusa v2 backend, Next.js
15 storefront with PayloadCMS v3 embedded, dual Postgres, MinIO-backed S3, and
AI tooling (Claude Code MCP servers + plugins) wired up out of the box.

## Stack

- **Backend** — Medusa v2 (REST API + admin dashboard)
- **Storefront** — Next.js 15 (App Router, React 19) + PayloadCMS v3
- **Databases** — Two isolated Postgres databases (Medusa and Payload)
- **Storage** — S3-compatible object storage (MinIO locally)
- **Tooling** — Turborepo, pnpm workspaces, TypeScript strict
- **AI tooling** — Six pre-configured MCP servers + curated Claude Code plugins
  (see [`docs/MCP.md`](docs/MCP.md))

## Prerequisites

- Node.js **20+**
- pnpm **10+** (the repo pins via `packageManager`)
- Docker (for local Postgres + MinIO)

## Quick start

```bash
# 1. Clone and install
git clone <repo-url> machxi-ecommerce-cms-starter
cd machxi-ecommerce-cms-starter
pnpm install

# 2. Copy env templates (root .env is auto-created by docker:dev if missing)
cp apps/backend/.env.template     apps/backend/.env
cp apps/storefront/.env.template  apps/storefront/.env.local

# 3. Start local infra (Postgres x2, MinIO + bucket init)
pnpm docker:dev

# 4. Migrate Medusa + create an admin user
pnpm --filter @machxi/backend exec medusa db:migrate
pnpm --filter @machxi/backend exec medusa user -e admin@example.com -p supersecret

# 5. Run both apps
pnpm dev
```

Then, **one manual step** before the storefront can call the API:

1. Open **http://localhost:9000/app** and log in with the user you just created.
2. Go to **Settings → Publishable API Keys**, create or copy a key.
3. Paste it into `apps/storefront/.env.local` as
   `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...` and restart the storefront.

Storefront is now live at **http://localhost:8000**.

## What's running

| Service        | URL                              | Notes                                       |
| -------------- | -------------------------------- | ------------------------------------------- |
| Storefront     | http://localhost:8000            | Next.js                                     |
| Payload Admin  | http://localhost:8000/admin      | Embedded in storefront                      |
| Medusa API     | http://localhost:9000            | REST                                        |
| Medusa Admin   | http://localhost:9000/app        | Use admin credentials from step 4           |
| Postgres       | localhost:5432                   | Two databases: `medusa`, `payload`          |
| MinIO API      | http://localhost:9100            | S3-compatible endpoint                      |
| MinIO Console  | http://localhost:9101            | `minioadmin` / `minioadmin`                 |

## Daily workflow

| Command                                     | What it does                                   |
| ------------------------------------------- | ---------------------------------------------- |
| `pnpm dev`                                  | Run both apps concurrently                     |
| `pnpm backend:dev`                          | Just the Medusa backend                        |
| `pnpm storefront:dev`                       | Just the Next.js storefront                    |
| `pnpm docker:dev`                           | Bring up Postgres + MinIO                      |
| `pnpm build` / `pnpm lint` / `pnpm test`    | Across the whole monorepo via Turborepo        |
| `pnpm setup:mcp`                            | Verify Claude Code MCP servers                 |
| `pnpm --filter @machxi/backend exec medusa <cmd>` | Run any Medusa CLI command from repo root |

## Configuration

Every env var is documented inline in its template — there is no canonical list
to keep in sync here. Templates:

- **`.env.template`** (repo root) — Docker compose (Postgres, MinIO) + optional
  GitHub MCP token
- **`apps/backend/.env.template`** — Medusa secrets, `DATABASE_URL`, CORS, S3
  pointing at MinIO
- **`apps/storefront/.env.template`** — Medusa publishable key,
  `PAYLOAD_DATABASE_URL`, `PAYLOAD_SECRET`, Payload S3, optional Payload MCP key

Copy each template to its working file (`.env`, `.env`, `.env.local`
respectively — all gitignored) and edit as needed. The defaults in the
templates already match the docker-compose stack — most teams won't need to
touch DB URLs locally.

## AI tooling (Claude Code)

This repo ships with `.mcp.json`, `.claude/settings.json`, and curated agents,
skills, and hooks under `.claude/`. On first run in this directory, [Claude
Code](https://claude.com/claude-code) will prompt you to:

1. Trust the three plugin marketplaces declared in `.claude/settings.json`
   (`medusa`, `payload-marketplace`, `claude-code-workflows`).
2. Install the 20 enabled plugins.
3. Approve the six MCP servers from `.mcp.json` (context7, chrome-devtools,
   postgres-medusa, postgres-payload, payload, github).

Verify with:

```bash
pnpm setup:mcp
```

Full setup, troubleshooting, and per-server usage are in [`docs/MCP.md`](docs/MCP.md).

## Repository layout

```
apps/
  backend/         Medusa v2 — REST API + admin dashboard
  storefront/      Next.js 15 + PayloadCMS v3
docker/            Postgres init scripts, MinIO bucket setup
docs/              MCP setup, architecture notes
scripts/
  docker-dev.mjs   Bootstrap local infra (called by pnpm docker:dev)
  setup-mcp.mjs    MCP verification report (pnpm setup:mcp)
  mcp/             Thin wrappers that launch each MCP server from .env
.claude/           Hooks, agents, skills, settings (team-shared)
.mcp.json          MCP server registry
```

## Documentation

- [`docs/MCP.md`](docs/MCP.md) — MCP servers, setup, and troubleshooting
- [`CLAUDE.md`](CLAUDE.md) — Project context for AI agents (root)
- [`apps/backend/CLAUDE.md`](apps/backend/CLAUDE.md) — Medusa v2 conventions
- [`apps/storefront/AGENTS.md`](apps/storefront/AGENTS.md) — Next.js + Payload conventions

## License

MIT — see [`LICENSE`](LICENSE).
