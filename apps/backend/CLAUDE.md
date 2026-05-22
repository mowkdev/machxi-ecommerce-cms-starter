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
