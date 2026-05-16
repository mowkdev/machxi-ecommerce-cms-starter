# MCP Servers

This repo ships with [`.mcp.json`](../.mcp.json) at the root, which registers
five [Model Context Protocol](https://modelcontextprotocol.io) servers for use
with [Claude Code](https://claude.com/claude-code). Anyone who clones the repo
and runs Claude Code here will be prompted to approve them on first use.

**The `.env` files are the single source of truth** — thin wrappers in
[`scripts/mcp/`](../scripts/mcp) read them at MCP-server-launch time. No shell
exports, no `setx`, no user env vars to maintain.

## What's included

| Server            | What it does                                                                                  | Source for config                |
| ----------------- | --------------------------------------------------------------------------------------------- | -------------------------------- |
| `context7`        | Live documentation lookup for Next.js, Payload, React, Lexical, etc.                          | _(no config needed)_             |
| `chrome-devtools` | Browser automation — navigate, screenshot, inspect console/network.                          | _(no config needed)_             |
| `postgres-medusa` | Read/write Medusa Postgres. Schema, tables, ad-hoc queries.                                   | `apps/backend/.env`: `DATABASE_URL` |
| `postgres-payload`| Read/write Payload Postgres (separate from Medusa's).                                        | `apps/storefront/.env.local`: `PAYLOAD_DATABASE_URL` |
| `payload`         | Find/update Payload collections via the official Payload MCP plugin.                          | `apps/storefront/.env.local`: `PAYLOAD_MCP_API_KEY` |

## Quick start

```bash
# 1. Make sure both .env files exist (standard onboarding)
cp apps/backend/.env.template     apps/backend/.env
cp apps/storefront/.env.template  apps/storefront/.env.local
# (fill in the values — DB URLs, Medusa publishable key, etc.)

# 2. Start the storefront once so Payload migrates the new MCP API-keys table
pnpm storefront:dev
# Open http://localhost:8000/admin → MCP → API Keys → create one,
# then paste it into apps/storefront/.env.local as PAYLOAD_MCP_API_KEY=...

# 3. Verify everything is wired up
pnpm setup:mcp
```

`pnpm setup:mcp` prints a branded report that confirms:

- both `.env` files exist and required vars are set;
- both Postgres databases are reachable (it runs a real `SELECT … FROM
  information_schema.tables` through the same wrapper Claude Code will use);
- the `context7` and `chrome-devtools` packages launch over MCP;
- the Payload MCP endpoint at `http://localhost:8000/api/mcp` is live and the
  API key is accepted.

After it's all green, **restart Claude Code in this directory** — it'll prompt
you to approve each server from `.mcp.json` on first run. Confirm with `/mcp`.

## How to use each server

### `context7` — live docs

Just ask. Claude picks it up when you mention a library:

> *"Look up the Next.js 16 `unstable_cache` API and refactor `lib/data/product.ts`
> to use it."*

> *"What changed in Payload 3.84 around `richText` field migrations?"*

### `chrome-devtools` — verify storefront UI

After `pnpm storefront:dev` is running:

> *"Open `http://localhost:8000/us/products/<slug>`, screenshot the PDP, and
> tell me whether the Payload-sourced description renders below the price."*

> *"Navigate the cart → checkout flow with a test product, screenshot each
> step, and watch the Network tab for failed `/store/carts` calls."*

This satisfies the "verify UI in a real browser" rule from `AGENTS.md`
without making the user test for you.

### `postgres-medusa` / `postgres-payload` — DB inspection

The MCP exposes ~17 tools (`pg_execute_query`, `pg_manage_schema`,
`pg_manage_indexes`, etc.). Two databases, two MCPs — name them explicitly:

> *"In `postgres-payload`, run `SELECT id, medusa_id, title, updated_at FROM
> products ORDER BY updated_at DESC LIMIT 5`."*

> *"Compare the `products.medusa_id` set in `postgres-payload` against the
> `product.id` set in `postgres-medusa` — find rows missing on either side."*

⚠️ **Write tools are exposed too** (`pg_execute_mutation`, `pg_execute_sql`).
Only ever point this at dev/local databases. To lock it down to read-only,
pass a tools-config JSON via `--tools-config` — see
[HenkDz/postgresql-mcp-server](https://github.com/HenkDz/postgresql-mcp-server).

### `payload` — CMS data access

> *"List Payload products that have an empty `description` field."*

> *"Update the SEO title on the product with `medusa_id = prod_XXX` to
> 'Hand-stitched leather wallet | DTC'."*

Access controls are enforced at two layers: the plugin config in
[`apps/storefront/src/payload.config.ts`](../apps/storefront/src/payload.config.ts)
(what's *exposed* — currently `products` and `media`; `users` is intentionally
not) and per-key toggles in the admin (what each key is *allowed* to do).

## Optional: Medusa MCP (manual install)

There's no published npm package, so it's not in `.mcp.json`. The community
[SGFGOV/medusa-mcp](https://github.com/SGFGOV/medusa-mcp) wraps the Medusa JS
SDK but requires a manual clone + build, then a user-level config pointing at
the built path.

In practice the `postgres-medusa` MCP + writing throwaway scripts against
`@medusajs/js-sdk` covers the same ground without the extra step.

## Files involved

| Path | Purpose |
|------|---------|
| `.mcp.json` | Server registry — checked into git, picked up by Claude Code |
| `scripts/mcp/postgres.mjs` | Wrapper: reads a connection string from any `.env` and spawns `@henkey/postgres-mcp-server` |
| `scripts/mcp/payload.mjs` | Wrapper: reads `PAYLOAD_MCP_API_KEY` from `.env.local` and spawns `mcp-remote` against `/api/mcp` |
| `scripts/setup-mcp.mjs` | Branded verification — run via `pnpm setup:mcp` |
| `apps/storefront/src/payload.config.ts` | Registers the Payload `mcpPlugin()` and declares which collections are exposed |

## Troubleshooting

| Symptom | Cause / fix |
|---------|------|
| `postgres-medusa` "Cannot read apps/backend/.env" | Run `cp apps/backend/.env.template apps/backend/.env` and fill in `DATABASE_URL`. |
| `postgres-payload` 28P01 "password authentication failed" | `PAYLOAD_DATABASE_URL` doesn't match your local Postgres role. Check the value in `apps/storefront/.env.local`. |
| `payload` MCP "PAYLOAD_MCP_API_KEY is empty" | Storefront not yet booted, or you haven't created the key. See **Quick start** step 2. |
| `payload` MCP returns 401 with a key set | API key was revoked or has zero capabilities enabled in admin. Re-toggle in `MCP → API Keys`. |
| `payload` MCP "fetch failed" | Storefront isn't running on `:8000`. `pnpm storefront:dev`. |
| `@payloadcms/plugin-mcp` peer warning about `@modelcontextprotocol/sdk` | Benign — minor-version mismatch with the SDK shipped via `payload` itself. |
| Want to override the Payload MCP URL (e.g. running on a different port) | Add `PAYLOAD_MCP_URL=...` to `apps/storefront/.env.local`. |

## Updating or removing a server

Edit `.mcp.json`, commit, push. Teammates will be re-prompted to approve on
next launch.
