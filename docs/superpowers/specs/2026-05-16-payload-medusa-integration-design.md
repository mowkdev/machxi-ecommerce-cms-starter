# Payload CMS + Medusa Integration — Design

**Date:** 2026-05-16
**Status:** Approved
**Source guide:** https://docs.medusajs.com/resources/integrations/guides/payload

## Goal

Integrate Payload CMS (latest, `3.84.1`) into the existing Medusa DTC starter monorepo so editors can enrich Medusa-managed products with CMS content (rich-text descriptions, additional media, SEO metadata) while keeping Medusa as the source of truth for commerce data. The storefront must render the combined dataset; the backend must keep Payload in sync automatically on every product/variant/option lifecycle event.

## Confirmed decisions (from brainstorming)

1. **Scope:** full guide — collections (Users/Media/Products), Payload module + service, all event subscribers (product + variant + option create/update/delete), workflows with compensation, virtual link, manual sync API + admin UI page, storefront display using Payload data.
2. **Tests:** backend module unit tests (mocked HTTP) + integration tests via `@medusajs/test-utils` `medusaIntegrationTestRunner` against an in-process HTTP fixture. No storefront test runner is added.
3. **Database:** two databases on the user's existing local Postgres — `medusa-dtc-starter` (existing) and a new `payload` database. User creates the empty `payload` DB; Payload runs its own migrations on first start.
4. **Location:** Payload is embedded in `apps/storefront`. Admin lives at `/admin`; Payload APIs live under `/api/...` on the same Next.js app.
5. **Next.js version:** upgrade `apps/storefront` from `15.5.18` to `^16.2.6` (latest 16.x) to satisfy Payload's peer requirement (`>=16.2.2 <17.0.0` is the only forward-looking supported range).

## Architecture

```
apps/
├── storefront/                                    Next.js 16.x — serves both storefront and Payload admin
│   ├── src/app/
│   │   ├── (storefront)/                          MOVED: existing routes
│   │   │   ├── [countryCode]/...
│   │   │   ├── global-error.tsx
│   │   │   ├── layout.tsx
│   │   │   ├── not-found.tsx
│   │   │   ├── robots.ts
│   │   │   └── sitemap.ts
│   │   └── (payload)/                             NEW: from @payloadcms/next template
│   │       ├── admin/[[...segments]]/page.tsx
│   │       ├── admin/[[...segments]]/not-found.tsx
│   │       ├── api/[...slug]/route.ts
│   │       ├── api/graphql/route.ts
│   │       ├── api/graphql-playground/route.ts
│   │       └── layout.tsx
│   ├── src/collections/                           NEW
│   │   ├── Users.ts
│   │   ├── Media.ts
│   │   └── Products.ts
│   ├── src/payload.config.ts                      NEW
│   ├── src/middleware.ts                          UPDATED: skip /admin
│   ├── next.config.ts                             UPDATED: withPayload()
│   ├── tsconfig.json                              UPDATED: @payload-config alias
│   └── package.json                               UPDATED: deps + undici override + scripts
│
└── backend/                                       Medusa 2.15.2
    ├── src/modules/payload/                       NEW
    │   ├── index.ts
    │   ├── service.ts
    │   ├── types.ts
    │   └── __tests__/service.unit.spec.ts
    ├── src/workflows/payload/                     NEW
    │   ├── steps/                                 atomic step files
    │   ├── create-payload-products.ts
    │   ├── update-payload-products.ts
    │   ├── delete-payload-products.ts
    │   ├── create-payload-product-variant.ts
    │   ├── update-payload-product-variants.ts
    │   ├── delete-payload-product-variant.ts
    │   ├── create-payload-product-option.ts
    │   └── delete-payload-product-option.ts
    ├── src/subscribers/                           NEW
    │   ├── product-created.ts
    │   ├── product-updated.ts
    │   ├── product-deleted.ts
    │   ├── product-variant-created.ts
    │   ├── product-variant-updated.ts
    │   ├── product-variant-deleted.ts
    │   ├── product-option-created.ts
    │   ├── product-option-deleted.ts
    │   └── products-sync-payload.ts
    ├── src/api/admin/payload/sync/[collection]/   NEW
    │   └── route.ts
    ├── src/admin/routes/settings/payload/         NEW
    │   └── page.tsx
    ├── src/links/product-payload.ts               NEW
    ├── integration-tests/                         NEW
    │   ├── setup.js
    │   ├── helpers/payload-mock-server.ts
    │   └── http/
    │       ├── payload-product-sync.spec.ts
    │       └── payload-manual-sync.spec.ts
    └── medusa-config.ts                           UPDATED: register payload module
```

Two cooperating systems, single deployment unit per app. Medusa is the canonical store of commerce data; Payload is the canonical store of CMS enrichment keyed by `medusa_id`. The storefront reads them as one object through the virtual link.

## Components

### Storefront — Payload setup

**Next.js 16 upgrade.** First commit in implementation order: bump `next` to `^16.2.6` and `eslint-config-next` to match. Run `pnpm install`, run `pnpm build`, fix anything broken. Likely impacts based on Next 16 changes: `next/headers` async API (already used pattern), middleware response types, image remote-pattern shape, caching defaults on `fetch`. Storefront types must still compile; existing functionality (region detection, cart, checkout, account) must still work in dev. This lands as its own commit so Payload regressions are bisectable from Next regressions.

**Dependencies (storefront `package.json`).**

Add:
- `payload@^3.84.1`
- `@payloadcms/next@^3.84.1`
- `@payloadcms/richtext-lexical@^3.84.1`
- `@payloadcms/db-postgres@^3.84.1`
- `sharp@^0.33.0`
- `graphql@^16.8.1`

Add at workspace root (or storefront `package.json`):

```json
{
  "resolutions": { "undici": "5.20.0" },
  "overrides": { "undici": "5.20.0" }
}
```

The existing workspace root already has a `pnpm.overrides` block (for React types). Add `undici` there. `resolutions` is honored by pnpm-installed Yarn-compatible tooling; both keys included to match the guide.

Add scripts to storefront `package.json`:
- `"generate:importmap": "payload generate:importmap"`
- update `"build"` to `"payload generate:importmap && next build"` so the import map is fresh on every build.

**`src/payload.config.ts`.**

```ts
import sharp from "sharp"
import path from "path"
import { fileURLToPath } from "url"
import { lexicalEditor } from "@payloadcms/richtext-lexical"
import { postgresAdapter } from "@payloadcms/db-postgres"
import { buildConfig } from "payload"
import { Users } from "./collections/Users"
import { Media } from "./collections/Media"
import { Products } from "./collections/Products"

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: { user: Users.slug },
  collections: [Users, Media, Products],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: { outputFile: path.resolve(dirname, "payload-types.ts") },
  db: postgresAdapter({
    pool: { connectionString: process.env.PAYLOAD_DATABASE_URL || "" },
  }),
  sharp,
})
```

**Collections.**

- `Users` — `auth: { useAPIKey: true }`, `useAsTitle: "email"`. Empty `fields: []`.
- `Media` — upload with image sizes (`thumbnail` 400×300, `card` 768×1024, `tablet` 1024 auto), `mimeTypes: ["image/*"]`, `pasteURL.allowList` including `localhost` and the public Medusa S3 buckets used in storefront `next.config.ts`. Single `alt` text field.
- `Products` — fields:
  - `medusa_id` (text, required, unique, indexed) — primary key for the link with Medusa
  - `title`, `handle`, `subtitle` (text)
  - `description` (Lexical rich text)
  - `thumbnail` (relation to `media`, upload)
  - `images` (array of media relations)
  - `seo` (group: `title`, `description`, `keywords`)
  - `options` (array: `medusa_id`, `title`, `values`) — validation blocks count change
  - `variants` (array: `medusa_id`, `title`, `sku`, `option_values`) — validation blocks count change
  - Access control: only `users` collection authenticated requests with admin role (or API key) can write. Read is open (storefront reads via Medusa-side service using API key anyway).
  - `beforeChange` hook: if `description` arrives as a plain string (from a Medusa sync), wrap it into a minimal Lexical document so the editor can open it later.

**Env vars** (`apps/storefront/.env.local`):

```
PAYLOAD_DATABASE_URL=postgres://postgres:@localhost:5432/payload
PAYLOAD_SECRET=<generate a random 32+ char string>
```

Add both to `apps/storefront/.env.template` so a fresh clone documents them. The existing `checkEnvVariables.ts` does not need them at build time (Payload reads them at runtime); we leave that file alone.

**`tsconfig.json`** — add path alias:

```json
"paths": {
  "@/*": ["./src/*"],
  "@payload-config": ["./src/payload.config.ts"]
}
```

**`next.config.ts`** — wrap the export:

```ts
import { withPayload } from "@payloadcms/next/withPayload"
// ... existing nextConfig ...
export default withPayload(nextConfig)
```

**`src/middleware.ts`** — extend the matcher to skip `admin` (Payload's UI) and `api` (Payload's REST/GraphQL). Current matcher already excludes `api`; we add `admin`:

```ts
matcher: [
  "/((?!api|_next/static|_next/image|favicon.ico|images|assets|png|svg|jpg|jpeg|gif|webp|admin).*)",
]
```

**App router restructure.**

Create `src/app/(storefront)/` and move into it: `[countryCode]/`, `global-error.tsx`, `layout.tsx`, `not-found.tsx`, `robots.ts`, `sitemap.ts`. Imports inside those files use absolute paths (`@/...`), so the move is transparent.

Add `src/app/(payload)/` with the standard Payload Next.js template files generated by `npx create-payload-app` (or copied from `node_modules/@payloadcms/next/templates`). After install, run `npx payload generate:importmap` once to materialize `src/app/(payload)/admin/importMap.js`.

### Backend — Payload module

**`apps/backend/src/modules/payload/types.ts`** — exports interfaces listed in the guide: `PayloadModuleOptions`, `PayloadCollectionItem`, `PayloadUpsertData`, `PayloadQueryOptions`, `PayloadItemResult<T>`, `PayloadBulkResult<T>`, `PayloadApiResponse<T>`. Also exports `PayloadProduct` (typed `PayloadCollectionItem` for the products collection, used by workflows and the link).

**`apps/backend/src/modules/payload/service.ts`** — `PayloadModuleService` class:

```ts
class PayloadModuleService {
  constructor(_, options: PayloadModuleOptions) { /* store options */ }

  private async makeRequest<T>(path, init?: RequestInit & { query?: object }): Promise<T>
  async create<T>(collection: string, data: PayloadUpsertData): Promise<PayloadItemResult<T>>
  async update<T>(collection: string, id: string, data: PayloadUpsertData): Promise<PayloadItemResult<T>>
  async delete(collection: string, id: string): Promise<{ message: string }>
  async find<T>(collection: string, options?: PayloadQueryOptions): Promise<PayloadBulkResult<T>>
  async list(filters: { product_id: string | string[] }): Promise<{ payload_product: PayloadProduct[] }>
}
```

Auth header: `Authorization: ${userCollection} API-Key ${apiKey}`. JSON content type. On non-2xx, throw `PayloadApiError` with status + raw body.

`list()` is shaped for the virtual link layer — given `product_id` (the Medusa product ID), it queries Payload's `products` collection by `medusa_id` and returns `{ payload_product: [...] }` keyed by `product_id` so Medusa's link runtime can match it.

**`apps/backend/src/modules/payload/index.ts`** — module registration:

```ts
import { Module } from "@medusajs/framework/utils"
import PayloadModuleService from "./service"
export const PAYLOAD_MODULE = "payload"
export default Module(PAYLOAD_MODULE, { service: PayloadModuleService })
```

**`apps/backend/medusa-config.ts`** — append `modules: [{ resolve: "./src/modules/payload", options: { serverUrl, apiKey, userCollection } }]` reading from `process.env`.

**Env vars** (`apps/backend/.env`):

```
PAYLOAD_SERVER_URL=http://localhost:8000
PAYLOAD_API_KEY=<generated by Payload after first admin user is created>
PAYLOAD_USER_COLLECTION=users
```

### Backend — Workflows

Each workflow lives in its own file in `apps/backend/src/workflows/payload/`. Each follows the Medusa `createWorkflow` + `createStep` pattern with compensation:

| Workflow | Input | Step(s) | Compensation |
|---|---|---|---|
| `create-payload-products` | `{ products: ProductDTO[] }` | `createPayloadProductsStep` (POST to Payload) | Delete on rollback |
| `update-payload-products` | `{ products: ProductDTO[] }` | `updatePayloadProductsStep` (PATCH) | Restore previous state (snapshot before update) |
| `delete-payload-products` | `{ ids: string[] }` | `deletePayloadProductsStep` (DELETE) | Best-effort: log and continue (deletes can't be cleanly compensated without snapshot) |
| `create-payload-product-variant` | `{ product_id, variant }` | look up Payload product → append variant → PATCH | Restore prior variants array |
| `update-payload-product-variants` | `{ product_id, variants }` | look up → patch variants subset → PATCH | Restore prior variants |
| `delete-payload-product-variant` | `{ product_id, variant_id }` | look up → remove variant → PATCH | Log only |
| `create-payload-product-option` | `{ product_id, option }` | look up → append option → PATCH | Restore prior options |
| `delete-payload-product-option` | `{ product_id, option_id }` | look up → remove option → PATCH | Log only |

All workflows resolve the Payload module via the workflow `container`: `container.resolve(PAYLOAD_MODULE)`.

Mapping helper `src/modules/payload/mappers.ts` (NEW): pure functions `mapMedusaProductToPayload(product)` and `mapMedusaVariantToPayload(variant)` to keep step bodies thin and tests focused.

### Backend — Subscribers

Each in `apps/backend/src/subscribers/`, following Medusa's standard subscriber signature:

```ts
export default async function ({ event, container }: SubscriberArgs<...>) { ... }
export const config: SubscriberConfig = { event: "..." }
```

| File | Event | Action |
|---|---|---|
| `product-created.ts` | `product.created` | Fetch full product, run `createPayloadProductsWorkflow` |
| `product-updated.ts` | `product.updated` | Fetch full product, run `updatePayloadProductsWorkflow` |
| `product-deleted.ts` | `product.deleted` | Run `deletePayloadProductsWorkflow` |
| `product-variant-created.ts` | `product-variant.created` | Run `createPayloadProductVariantWorkflow` |
| `product-variant-updated.ts` | `product-variant.updated` | Run `updatePayloadProductVariantsWorkflow` |
| `product-variant-deleted.ts` | `product-variant.deleted` | Run `deletePayloadProductVariantWorkflow` |
| `product-option-created.ts` | `product-option.created` | Run `createPayloadProductOptionWorkflow` |
| `product-option-deleted.ts` | `product-option.deleted` | Run `deletePayloadProductOptionWorkflow` |
| `products-sync-payload.ts` | `products.sync-payload` (custom) | Bulk-sync all Medusa products that don't yet exist in Payload |

All subscribers catch and log errors so a Payload outage cannot crash the Medusa event loop. Idempotency: each create-side subscriber checks if the Payload row already exists (by `medusa_id`) before creating.

### Backend — Virtual link

**`apps/backend/src/links/product-payload.ts`:**

```ts
import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"
import { PAYLOAD_MODULE } from "../modules/payload"

export default defineLink(
  { linkable: ProductModule.linkable.product, field: "id" },
  {
    linkable: {
      serviceName: PAYLOAD_MODULE,
      alias: "payload_product",
      primaryKey: "product_id",
    },
  },
  { readOnly: true }
)
```

Activated by the `list()` method on the service. No migrations needed (read-only link).

### Backend — Manual sync API + admin UI

**`apps/backend/src/api/admin/payload/sync/[collection]/route.ts`** — POST handler that emits `${collection}.sync-payload`. Validates `collection` against an allowlist (`["products"]` initially).

**`apps/backend/src/admin/routes/settings/payload/page.tsx`** — Medusa admin route extension. React component (uses `@tanstack/react-query` which is already a dep) with:
- A title and short description
- A "Sync products to Payload" button → POSTs to `/admin/payload/sync/products`
- A status banner showing the result
- A small panel showing the configured Payload server URL (read from a tiny `/admin/payload/config` GET route added alongside the sync route)

### Storefront — Display

**`apps/storefront/src/lib/data/products.ts`** — products fetch helper. Add `"+payload_product.*"` to the `fields` query so the virtual link returns Payload data.

**`apps/storefront/src/types/global.ts`** (NEW):

```ts
import type { HttpTypes } from "@medusajs/types"

export type PayloadProductFromLink = {
  id: string
  medusa_id: string
  title?: string
  handle?: string
  subtitle?: string
  description?: SerializedLexicalEditorState
  thumbnail?: PayloadMedia
  images?: { image: PayloadMedia }[]
  seo?: { title?: string; description?: string; keywords?: string }
}

export type StoreProductWithPayload = HttpTypes.StoreProduct & {
  payload_product?: PayloadProductFromLink
}
```

**Product display components** in `apps/storefront/src/modules/products/*`:
- Title: `payload_product?.title ?? product.title`
- Description: when `payload_product?.description` present, render via `@payloadcms/richtext-lexical/react`'s `RichText` component; else render Medusa's plain string.
- Thumbnail/images: prefer `payload_product?.thumbnail?.url` / `payload_product?.images[].image.url`; fall back to Medusa's `thumbnail`/`images`.
- SEO: prefer Payload's `seo.title`/`seo.description` in page metadata.

Where Payload media URLs are loaded, ensure `next.config.ts` `images.remotePatterns` allows `http://localhost:8000` (already covered by the `localhost` pattern).

## Data flow

**Create flow (steady state).**
1. Admin creates a product in Medusa Admin → Medusa emits `product.created`.
2. `product-created` subscriber fires → resolves the product (with options/variants) → runs `createPayloadProductsWorkflow`.
3. Workflow step calls `payloadService.create("products", mapped)` → HTTP POST `/api/products` on `http://localhost:8000` with API key.
4. Payload writes the row keyed by `medusa_id`.
5. Compensation: on workflow failure, the compensation step issues DELETE for the Payload row to avoid orphans.

**Read flow (storefront).**
1. Storefront calls Medusa `/store/products?fields=...,+payload_product.*`.
2. Medusa's link runtime sees `payload_product` alias → calls `PayloadModuleService.list({ product_id: [...] })`.
3. Service issues `GET /api/products?where[medusa_id][in]=...&depth=2` → returns rows.
4. Service shapes response into `{ payload_product: [...] }` for the link layer.
5. Medusa returns merged objects → storefront renders Payload fields with Medusa fallback.

**Manual sync flow (one-off backfill).**
1. Admin clicks "Sync products" on the settings page → POST `/admin/payload/sync/products`.
2. Route emits `products.sync-payload`.
3. `products-sync-payload` subscriber queries Medusa for products without a corresponding Payload row, batches them, runs `createPayloadProductsWorkflow` per batch.

## Error handling

- **Service layer.** All HTTP errors raise `PayloadApiError` (status, body, request URL). Network/timeouts raise a wrapped `PayloadApiError` with status `0`. The service never silently returns empty.
- **Workflows.** Each workflow has a compensation step. Where a true compensation is impossible (deletes without snapshot), the step logs the failure and continues; the workflow surfaces the original error.
- **Subscribers.** Wrap workflow invocations in try/catch; log via the Medusa logger; never throw out of a subscriber (would interfere with event bus retry semantics).
- **Idempotency.** Create-side flows look up the Payload row by `medusa_id` before inserting. If a row exists, the workflow short-circuits to "no-op success".
- **Storefront.** When `payload_product` is missing or any of its fields are absent, fall back to Medusa data. Never crash a PDP because Payload is unreachable or unsynced. Lexical render: if `description` is malformed, fall back to plain-text Medusa description.

## Testing

### Backend unit tests

`apps/backend/src/modules/payload/__tests__/service.unit.spec.ts`

Cover:
- Auth header is `${userCollection} API-Key ${apiKey}`
- `create("products", data)` POSTs `/api/products` with JSON body
- `update("products", "id", data)` PATCHes `/api/products/id`
- `delete("products", "id")` DELETEs `/api/products/id`
- `find("products", { where: { medusa_id: { equals: "x" } } })` builds correct querystring
- `list({ product_id: ["m1", "m2"] })` calls `find` with `medusa_id: { in: [...] }` and reshapes the response to `{ payload_product: [...] }`
- Non-2xx response throws `PayloadApiError` with status and body
- Network error is wrapped, not re-thrown raw

Service constructor accepts an injected `fetch` (default `globalThis.fetch`) so tests don't monkey-patch globals.

`apps/backend/src/modules/payload/__tests__/mappers.unit.spec.ts`

- `mapMedusaProductToPayload(product)` produces correct field shape
- `mapMedusaVariantToPayload(variant)` produces correct shape
- Plain-text description is wrapped in Lexical document shape

### Backend subscriber unit tests

`apps/backend/src/subscribers/__tests__/product-created.unit.spec.ts` (and one per subscriber)

- Subscriber resolves the right workflow from a fake container
- Subscriber passes the right input shape
- Subscriber catches workflow errors without throwing
- Subscriber is idempotent when the Payload row already exists (where applicable)

### Backend integration tests

`apps/backend/integration-tests/http/payload-product-sync.spec.ts`

- Uses `medusaIntegrationTestRunner` from `@medusajs/test-utils`
- Registers the Payload module with `serverUrl: http://127.0.0.1:<random>` pointing at an in-process HTTP fixture (`integration-tests/helpers/payload-mock-server.ts`) that records all requests and returns canned responses
- Test cases:
  1. Create product via Medusa store/admin API → assert mock Payload received `POST /api/products` with `medusa_id` matching
  2. Update product → assert `PATCH /api/products/{id}`
  3. Delete product → assert `DELETE /api/products/{id}`
  4. Create a variant → assert `PATCH /api/products/{id}` with updated `variants` array
  5. Read product through storefront-facing endpoint with `+payload_product.*` → assert response includes the linked Payload data

`apps/backend/integration-tests/http/payload-manual-sync.spec.ts`

- Seed: create two products directly in Medusa with the Payload module mocked to return "not found" so they appear unsynced
- POST `/admin/payload/sync/products` → assert mock Payload received POST requests for both
- Second POST returns 200 immediately (idempotent)

`apps/backend/integration-tests/setup.js` — minimal setup file that the existing jest config already references. We add to it; do not regress existing tests if any are added later.

### Storefront

No new test runner. Type-check covers the new types; `pnpm build` covers component integration end-to-end.

### Build verification

- `pnpm -r build` from monorepo root must exit 0.
- `pnpm --filter @dtc/storefront build` must produce a working `.next` output and an `importMap.js` for Payload.
- `pnpm --filter @dtc/backend build` must produce a working Medusa build.
- `pnpm --filter @dtc/backend test:unit` and `pnpm --filter @dtc/backend test:integration:http` must pass.

## Sequencing

Implementation lands in discrete, individually-buildable commits:

1. **Next.js 16 upgrade in storefront.** Bump deps, fix breakages, build green.
2. **Payload installed + admin reachable.** Add Payload deps, `payload.config.ts`, app router restructure, `withPayload`, middleware update, env scaffold. Storefront `pnpm build` green; running `pnpm dev` shows admin at `/admin`.
3. **Payload collections registered.** Users/Media/Products with the fields and validation listed above. Import map generated. `pnpm build` green.
4. **Payload module + service in Medusa.** Module registration, service with all methods, types, mappers, env scaffold. Unit tests pass.
5. **Workflows + virtual link.** All workflows and `links/product-payload.ts`. Service `list()` finalized for the link.
6. **Subscribers.** All eight subscribers wired to events. Unit tests pass.
7. **Manual sync API + admin UI.** Route + admin page.
8. **Storefront display.** Types, `products.ts` field expansion, component updates.
9. **Integration tests + final build.** `medusaIntegrationTestRunner`-driven tests against the mock Payload HTTP server. Full monorepo `pnpm build` and `pnpm test` green.

## Out of scope

- Authentication SSO between Medusa Admin and Payload (each has its own login).
- Payload → Medusa write-back (Payload is read-mostly enrichment; Medusa is source of truth).
- Production hardening: rate limiting, retries with exponential backoff, dead-letter queues for failed syncs. The service throws structured errors; production policy is a follow-up.
- Migrating existing Medusa products that already exist before Payload was installed — covered by the manual sync button but no automated one-time backfill on first boot.
- Localized content in Payload. Storefront has locales (`apps/storefront/src/lib/data/locales.ts`) but Payload localization config is deferred.
- Image upload from Medusa-hosted S3 into Payload Media — Payload Media references Medusa-hosted URLs via `pasteURL`; copying assets is a follow-up.

## Open risks

- **Next.js 16 upgrade may surface storefront regressions** unrelated to Payload. Mitigated by landing the upgrade as its own commit, building and smoke-testing before adding Payload code.
- **`undici` override** is a guide-recommended pin; if pnpm 10 refuses the resolution or it conflicts with `@medusajs/js-sdk`, fall back to `pnpm.overrides` only (drop `resolutions`).
- **Payload migrations on first start** require an existing empty `payload` database. The implementation plan should include explicit setup instructions; running `pnpm dev` without that DB will fail.
- **`generate:importmap`** must run after any collection change. The build script handles it; developers running `pnpm dev` for the first time need to run it once manually (documented).
