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
