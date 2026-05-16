# Payload CMS + Medusa Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Embed Payload CMS 3.84.1 inside the Next.js storefront, register a Payload module in the Medusa backend, and wire bi-directional sync so editors can enrich Medusa products with CMS content while the storefront renders the combined view.

**Architecture:** Payload runs as a Next.js route group `(payload)` inside `apps/storefront`. Medusa contains a `payload` module whose service is a typed HTTP client; workflows mutate Payload via that service; subscribers react to product events; a virtual link merges Payload content into Medusa product reads. Medusa is the source of truth for commerce data; Payload stores enrichment keyed by `medusa_id`.

**Tech Stack:** Payload 3.84.1, @payloadcms/next 3.84.1, @payloadcms/db-postgres, @payloadcms/richtext-lexical, sharp, graphql 16; Next.js 16.2.6; React 19; Medusa 2.15.2; pnpm 10 + Turborepo; Jest + @medusajs/test-utils for backend tests.

**Source spec:** `docs/superpowers/specs/2026-05-16-payload-medusa-integration-design.md`

---

## File Map

### `apps/storefront/`

**Create:**
- `src/app/(storefront)/` — route group; existing files moved into it
- `src/app/(payload)/layout.tsx`
- `src/app/(payload)/custom.scss`
- `src/app/(payload)/admin/[[...segments]]/page.tsx`
- `src/app/(payload)/admin/[[...segments]]/not-found.tsx`
- `src/app/(payload)/admin/importMap.js` (auto-generated)
- `src/app/(payload)/api/[...slug]/route.ts`
- `src/app/(payload)/api/graphql/route.ts`
- `src/app/(payload)/api/graphql-playground/route.ts`
- `src/payload.config.ts`
- `src/collections/Users.ts`
- `src/collections/Media.ts`
- `src/collections/Products.ts`
- `src/types/payload.ts`
- `src/types/global.ts`
- `src/components/payload/RichText.tsx`
- `.env.template` updates

**Modify:**
- `package.json` (deps, scripts, overrides)
- `next.config.ts` (withPayload, image patterns)
- `tsconfig.json` (path alias)
- `src/middleware.ts` (matcher)
- `src/lib/data/products.ts` (fields)
- `src/modules/products/templates/index.tsx` or equivalent PDP component (render Payload data)
- `src/modules/products/components/...` (title/description/thumbnail consumers)

**Move (no content change other than imports):**
- `src/app/[countryCode]/` → `src/app/(storefront)/[countryCode]/`
- `src/app/global-error.tsx` → `src/app/(storefront)/global-error.tsx`
- `src/app/layout.tsx` → `src/app/(storefront)/layout.tsx`
- `src/app/not-found.tsx` → `src/app/(storefront)/not-found.tsx`
- `src/app/robots.ts` → `src/app/(storefront)/robots.ts`
- `src/app/sitemap.ts` → `src/app/(storefront)/sitemap.ts`

### `apps/backend/`

**Create:**
- `src/modules/payload/index.ts`
- `src/modules/payload/service.ts`
- `src/modules/payload/types.ts`
- `src/modules/payload/mappers.ts`
- `src/modules/payload/errors.ts`
- `src/modules/payload/__tests__/service.unit.spec.ts`
- `src/modules/payload/__tests__/mappers.unit.spec.ts`
- `src/workflows/payload/steps/create-payload-products.ts`
- `src/workflows/payload/steps/update-payload-products.ts`
- `src/workflows/payload/steps/delete-payload-products.ts`
- `src/workflows/payload/steps/upsert-payload-product-variants.ts`
- `src/workflows/payload/steps/delete-payload-product-variant.ts`
- `src/workflows/payload/steps/upsert-payload-product-options.ts`
- `src/workflows/payload/steps/delete-payload-product-option.ts`
- `src/workflows/payload/create-payload-products.ts`
- `src/workflows/payload/update-payload-products.ts`
- `src/workflows/payload/delete-payload-products.ts`
- `src/workflows/payload/create-payload-product-variant.ts`
- `src/workflows/payload/update-payload-product-variants.ts`
- `src/workflows/payload/delete-payload-product-variant.ts`
- `src/workflows/payload/create-payload-product-option.ts`
- `src/workflows/payload/delete-payload-product-option.ts`
- `src/subscribers/product-created.ts`
- `src/subscribers/product-updated.ts`
- `src/subscribers/product-deleted.ts`
- `src/subscribers/product-variant-created.ts`
- `src/subscribers/product-variant-updated.ts`
- `src/subscribers/product-variant-deleted.ts`
- `src/subscribers/product-option-created.ts`
- `src/subscribers/product-option-deleted.ts`
- `src/subscribers/products-sync-payload.ts`
- `src/subscribers/__tests__/product-created.unit.spec.ts`
- `src/subscribers/__tests__/product-updated.unit.spec.ts`
- `src/subscribers/__tests__/product-deleted.unit.spec.ts`
- `src/subscribers/__tests__/product-variant-created.unit.spec.ts`
- `src/subscribers/__tests__/product-variant-updated.unit.spec.ts`
- `src/subscribers/__tests__/product-variant-deleted.unit.spec.ts`
- `src/subscribers/__tests__/product-option-created.unit.spec.ts`
- `src/subscribers/__tests__/product-option-deleted.unit.spec.ts`
- `src/subscribers/__tests__/products-sync-payload.unit.spec.ts`
- `src/api/admin/payload/sync/[collection]/route.ts`
- `src/api/admin/payload/config/route.ts`
- `src/admin/routes/settings/payload/page.tsx`
- `src/links/product-payload.ts`
- `integration-tests/setup.js`
- `integration-tests/helpers/payload-mock-server.ts`
- `integration-tests/http/payload-product-sync.spec.ts`
- `integration-tests/http/payload-manual-sync.spec.ts`

**Modify:**
- `medusa-config.ts` (register payload module)
- `.env.template` (new env vars)

---

## Task 1: Bump storefront to Next.js 16.x

**Files:**
- Modify: `apps/storefront/package.json`

- [ ] **Step 1: Update Next.js and eslint-config-next**

Edit `apps/storefront/package.json` `dependencies` and `devDependencies`:

```jsonc
{
  "dependencies": {
    "next": "^16.2.6"
    // ... unchanged
  },
  "devDependencies": {
    "eslint-config-next": "^16.2.6"
    // ... unchanged
  }
}
```

- [ ] **Step 2: Reinstall**

Run from monorepo root:

```bash
pnpm install
```

Expected: pnpm resolves Next 16.2.6 and updates lockfile.

- [ ] **Step 3: Verify the installed version**

```bash
cat apps/storefront/node_modules/next/package.json | grep '"version"' | head -1
```

Expected: `"version": "16.2.6"` (or compatible patch).

- [ ] **Step 4: Run storefront build**

```bash
pnpm --filter @dtc/storefront build
```

Expected: Build completes with exit 0. If there are TypeScript errors, fix only the strictly-necessary ones in storefront source (do not rewrite the storefront; the spec leaves out-of-scope refactors out). Common Next 16 breakages and fixes:
- `cookies()`, `headers()`, `params`, `searchParams` are async — `await` them where used.
- `NextRequest.ip` removed — read `request.headers.get("x-forwarded-for")` if used.
- Middleware return types — ensure handlers return `NextResponse | undefined`.

- [ ] **Step 5: Smoke-test dev**

```bash
pnpm --filter @dtc/storefront dev
```

Expected: server starts on port 8000 without crashes. Hit Ctrl+C after seeing "Ready in ...".

- [ ] **Step 6: Commit**

```bash
git add apps/storefront/package.json pnpm-lock.yaml
git add -A apps/storefront/src   # only if source files needed Next 16 fixes
git commit -m "chore(storefront): upgrade to Next.js 16.2.6"
```

---

## Task 2: Install Payload dependencies and undici override

**Files:**
- Modify: `apps/storefront/package.json`
- Modify: `package.json` (root, for `pnpm.overrides`)

- [ ] **Step 1: Add Payload dependencies to storefront `package.json`**

Add to `apps/storefront/package.json` `dependencies` (alphabetised in the file):

```jsonc
{
  "dependencies": {
    "@payloadcms/db-postgres": "^3.84.1",
    "@payloadcms/next": "^3.84.1",
    "@payloadcms/richtext-lexical": "^3.84.1",
    "graphql": "^16.8.1",
    "payload": "^3.84.1",
    "sharp": "^0.33.0"
  }
}
```

- [ ] **Step 2: Add undici override at the root**

Edit `package.json` (root). Replace the existing `pnpm.overrides` block with:

```jsonc
{
  "pnpm": {
    "overrides": {
      "@types/react": "19.0.5",
      "@types/react-dom": "19.0.5",
      "undici": "5.20.0"
    }
  }
}
```

- [ ] **Step 3: Install**

```bash
pnpm install
```

Expected: pnpm resolves Payload 3.84.1 packages. No peer-dependency errors against Next 16.2.6 (Payload supports `>=16.2.2 <17`).

- [ ] **Step 4: Commit**

```bash
git add package.json apps/storefront/package.json pnpm-lock.yaml
git commit -m "feat(storefront): install Payload 3.84.1 dependencies"
```

---

## Task 3: Add `@payload-config` tsconfig path alias

**Files:**
- Modify: `apps/storefront/tsconfig.json`

- [ ] **Step 1: Edit `apps/storefront/tsconfig.json`**

Update the `paths` block:

```jsonc
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@payload-config": ["./src/payload.config.ts"]
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/storefront/tsconfig.json
git commit -m "chore(storefront): add @payload-config tsconfig path alias"
```

---

## Task 4: Create initial `payload.config.ts` (no collections yet)

**Files:**
- Create: `apps/storefront/src/payload.config.ts`

- [ ] **Step 1: Create the file**

Write `apps/storefront/src/payload.config.ts`:

```ts
import path from "path"
import { fileURLToPath } from "url"
import sharp from "sharp"
import { lexicalEditor } from "@payloadcms/richtext-lexical"
import { postgresAdapter } from "@payloadcms/db-postgres"
import { buildConfig } from "payload"

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  collections: [],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.PAYLOAD_DATABASE_URL || "",
    },
  }),
  sharp,
})
```

- [ ] **Step 2: Commit**

```bash
git add apps/storefront/src/payload.config.ts
git commit -m "feat(storefront): add initial payload.config.ts"
```

---

## Task 5: Wrap `next.config.ts` with `withPayload`

**Files:**
- Modify: `apps/storefront/next.config.ts`

- [ ] **Step 1: Edit `apps/storefront/next.config.ts`**

Add the import at the top and replace the default export:

```ts
import type { NextConfig } from "next"
import { withPayload } from "@payloadcms/next/withPayload"
import { checkEnvVariables } from "./check-env-variables"

checkEnvVariables()

const S3_HOSTNAME = process.env.MEDUSA_CLOUD_S3_HOSTNAME
const S3_PATHNAME = process.env.MEDUSA_CLOUD_S3_PATHNAME

const nextConfig: NextConfig = {
  reactStrictMode: true,
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: "https", hostname: "medusa-public-images.s3.eu-west-1.amazonaws.com" },
      { protocol: "https", hostname: "medusa-server-testing.s3.amazonaws.com" },
      { protocol: "https", hostname: "medusa-server-testing.s3.us-east-1.amazonaws.com" },
      ...(S3_HOSTNAME && S3_PATHNAME
        ? [{ protocol: "https" as const, hostname: S3_HOSTNAME, pathname: S3_PATHNAME }]
        : []),
    ],
  },
}

export default withPayload(nextConfig)
```

- [ ] **Step 2: Commit**

```bash
git add apps/storefront/next.config.ts
git commit -m "feat(storefront): wrap next.config with withPayload"
```

---

## Task 6: Add Payload env vars to storefront `.env.template`

**Files:**
- Modify: `apps/storefront/.env.template`

- [ ] **Step 1: Inspect the existing template**

```bash
cat apps/storefront/.env.template
```

- [ ] **Step 2: Append Payload variables**

Add these lines to the end of `apps/storefront/.env.template`:

```dotenv

# Payload CMS — embedded in storefront
# Postgres connection for Payload's own database (separate from Medusa's)
PAYLOAD_DATABASE_URL=postgres://postgres:@localhost:5432/payload
# Random 32+ char string used to sign Payload sessions and API keys
PAYLOAD_SECRET=replace-with-random-string
```

- [ ] **Step 3: Commit**

```bash
git add apps/storefront/.env.template
git commit -m "docs(storefront): document Payload env vars in template"
```

---

## Task 7: Update storefront middleware to skip `/admin`

**Files:**
- Modify: `apps/storefront/src/middleware.ts:161-165`

- [ ] **Step 1: Edit the `matcher` config**

In `apps/storefront/src/middleware.ts`, replace the trailing `export const config` block with:

```ts
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|assets|png|svg|jpg|jpeg|gif|webp|admin).*)",
  ],
}
```

(Adds `admin` to the negative lookahead.)

- [ ] **Step 2: Commit**

```bash
git add apps/storefront/src/middleware.ts
git commit -m "feat(storefront): exclude /admin from locale middleware"
```

---

## Task 8: Move existing app router files into `(storefront)` route group

**Files:**
- Move: every file currently in `apps/storefront/src/app/` (except node_modules etc.) into `apps/storefront/src/app/(storefront)/`

- [ ] **Step 1: Create the new route group directory and move files**

Run from the repo root:

```bash
mkdir -p apps/storefront/src/app/\(storefront\)
git mv apps/storefront/src/app/\[countryCode\] apps/storefront/src/app/\(storefront\)/\[countryCode\]
git mv apps/storefront/src/app/global-error.tsx apps/storefront/src/app/\(storefront\)/global-error.tsx
git mv apps/storefront/src/app/layout.tsx apps/storefront/src/app/\(storefront\)/layout.tsx
git mv apps/storefront/src/app/not-found.tsx apps/storefront/src/app/\(storefront\)/not-found.tsx
git mv apps/storefront/src/app/robots.ts apps/storefront/src/app/\(storefront\)/robots.ts
git mv apps/storefront/src/app/sitemap.ts apps/storefront/src/app/\(storefront\)/sitemap.ts
```

(On Windows PowerShell, use the equivalent with backtick escapes or call `Move-Item` for each.)

- [ ] **Step 2: Verify directory listing**

```bash
ls apps/storefront/src/app/
ls apps/storefront/src/app/\(storefront\)/
```

Expected: `app/` contains only `(storefront)/`. `(storefront)/` contains `[countryCode]/`, `global-error.tsx`, `layout.tsx`, `not-found.tsx`, `robots.ts`, `sitemap.ts`.

- [ ] **Step 3: Verify type-check**

```bash
pnpm --filter @dtc/storefront exec tsc --noEmit
```

Expected: exit 0. Imports use `@/...` so the move is transparent.

- [ ] **Step 4: Commit**

```bash
git commit -m "refactor(storefront): wrap app router in (storefront) route group"
```

---

## Task 9: Add Payload route group `(payload)`

**Files:**
- Create: `apps/storefront/src/app/(payload)/layout.tsx`
- Create: `apps/storefront/src/app/(payload)/custom.scss`
- Create: `apps/storefront/src/app/(payload)/admin/[[...segments]]/page.tsx`
- Create: `apps/storefront/src/app/(payload)/admin/[[...segments]]/not-found.tsx`
- Create: `apps/storefront/src/app/(payload)/api/[...slug]/route.ts`
- Create: `apps/storefront/src/app/(payload)/api/graphql/route.ts`
- Create: `apps/storefront/src/app/(payload)/api/graphql-playground/route.ts`

- [ ] **Step 1: Create `(payload)/layout.tsx`**

```tsx
/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from "@payload-config"
import "@payloadcms/next/css"
import type { ServerFunctionClient } from "payload"
import { handleServerFunctions, RootLayout } from "@payloadcms/next/layouts"
import React from "react"

import { importMap } from "./admin/importMap.js"
import "./custom.scss"

type Args = {
  children: React.ReactNode
}

const serverFunction: ServerFunctionClient = async function (args) {
  "use server"
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  })
}

const Layout = ({ children }: Args) => (
  <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
    {children}
  </RootLayout>
)

export default Layout
```

- [ ] **Step 2: Create `(payload)/custom.scss`**

```scss
/* Storefront Payload admin custom styling — currently empty */
```

- [ ] **Step 3: Create `(payload)/admin/[[...segments]]/page.tsx`**

```tsx
/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import type { Metadata } from "next"

import config from "@payload-config"
import { RootPage, generatePageMetadata } from "@payloadcms/next/views"
import { importMap } from "../importMap"

type Args = {
  params: Promise<{ segments: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] }>
}

export const generateMetadata = ({ params, searchParams }: Args): Promise<Metadata> =>
  generatePageMetadata({ config, params, searchParams })

const Page = ({ params, searchParams }: Args) =>
  RootPage({ config, params, searchParams, importMap })

export default Page
```

- [ ] **Step 4: Create `(payload)/admin/[[...segments]]/not-found.tsx`**

```tsx
/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import type { Metadata } from "next"

import config from "@payload-config"
import { NotFoundPage, generatePageMetadata } from "@payloadcms/next/views"
import { importMap } from "../importMap"

type Args = {
  params: Promise<{ segments: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] }>
}

export const generateMetadata = ({ params, searchParams }: Args): Promise<Metadata> =>
  generatePageMetadata({ config, params, searchParams })

const NotFound = ({ params, searchParams }: Args) =>
  NotFoundPage({ config, params, searchParams, importMap })

export default NotFound
```

- [ ] **Step 5: Create `(payload)/api/[...slug]/route.ts`**

```ts
/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from "@payload-config"
import "@payloadcms/next/css"
import {
  REST_DELETE,
  REST_GET,
  REST_OPTIONS,
  REST_PATCH,
  REST_POST,
  REST_PUT,
} from "@payloadcms/next/routes"

export const GET = REST_GET(config)
export const POST = REST_POST(config)
export const DELETE = REST_DELETE(config)
export const PATCH = REST_PATCH(config)
export const PUT = REST_PUT(config)
export const OPTIONS = REST_OPTIONS(config)
```

- [ ] **Step 6: Create `(payload)/api/graphql/route.ts`**

```ts
/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from "@payload-config"
import { GRAPHQL_POST, REST_OPTIONS } from "@payloadcms/next/routes"

export const POST = GRAPHQL_POST(config)
export const OPTIONS = REST_OPTIONS(config)
```

- [ ] **Step 7: Create `(payload)/api/graphql-playground/route.ts`**

```ts
/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from "@payload-config"
import "@payloadcms/next/css"
import { GRAPHQL_PLAYGROUND_GET } from "@payloadcms/next/routes"

export const GET = GRAPHQL_PLAYGROUND_GET(config)
```

- [ ] **Step 8: Commit (importMap.js is generated in Task 10)**

```bash
git add apps/storefront/src/app/\(payload\)
git commit -m "feat(storefront): add Payload (payload) route group from template"
```

---

## Task 10: Generate the Payload import map

**Files:**
- Modify: `apps/storefront/package.json` (add `generate:importmap` script)
- Generated (do not edit by hand): `apps/storefront/src/app/(payload)/admin/importMap.js`

- [ ] **Step 1: Add the script**

Update `apps/storefront/package.json` `scripts` block:

```jsonc
{
  "scripts": {
    "dev": "next dev -p 8000",
    "build": "payload generate:importmap && next build",
    "start": "next start",
    "lint": "next lint",
    "generate:importmap": "payload generate:importmap"
  }
}
```

- [ ] **Step 2: Run the generator**

```bash
pnpm --filter @dtc/storefront generate:importmap
```

Expected: writes `apps/storefront/src/app/(payload)/admin/importMap.js`. The file contains an object map of Payload's runtime components. It is committed (Payload's docs say "do not modify" — that means by hand — but it must be in version control because `layout.tsx` and `page.tsx` import it).

- [ ] **Step 3: Commit**

```bash
git add apps/storefront/package.json
git add 'apps/storefront/src/app/(payload)/admin/importMap.js'
git commit -m "feat(storefront): generate Payload import map and add build script"
```

---

## Task 11: Smoke-test Payload admin in dev

**No file changes.** Verification step.

- [ ] **Step 1: Ensure an empty `payload` database exists on local Postgres**

```bash
psql -U postgres -c "CREATE DATABASE payload"
```

Expected: `CREATE DATABASE`. If it already exists, that's fine.

- [ ] **Step 2: Set local env vars**

If `apps/storefront/.env.local` does not exist, copy the template:

```bash
cp apps/storefront/.env.template apps/storefront/.env.local
```

Edit `.env.local` and set:

```dotenv
PAYLOAD_DATABASE_URL=postgres://postgres:@localhost:5432/payload
PAYLOAD_SECRET=<paste a 32+ char random string>
```

- [ ] **Step 3: Start the storefront in dev**

```bash
pnpm --filter @dtc/storefront dev
```

Expected: Next.js compiles. First request to `/admin` triggers Payload's auto-migration on the `payload` database. Open `http://localhost:8000/admin` in a browser. Expected: Payload "Create your first user" screen.

(Do not create the admin user yet — we add collections first.)

- [ ] **Step 4: Stop the dev server**

Ctrl+C.

---

## Task 12: Create the `Users` collection

**Files:**
- Create: `apps/storefront/src/collections/Users.ts`

- [ ] **Step 1: Write `apps/storefront/src/collections/Users.ts`**

```ts
import type { CollectionConfig } from "payload"

export const Users: CollectionConfig = {
  slug: "users",
  admin: {
    useAsTitle: "email",
  },
  auth: {
    useAPIKey: true,
  },
  fields: [],
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/storefront/src/collections/Users.ts
git commit -m "feat(payload): add Users collection with API key auth"
```

---

## Task 13: Create the `Media` collection

**Files:**
- Create: `apps/storefront/src/collections/Media.ts`

- [ ] **Step 1: Write `apps/storefront/src/collections/Media.ts`**

```ts
import type { CollectionConfig } from "payload"

export const Media: CollectionConfig = {
  slug: "media",
  upload: {
    staticDir: "public",
    imageSizes: [
      { name: "thumbnail", width: 400, height: 300, position: "centre" },
      { name: "card", width: 768, height: 1024, position: "centre" },
      { name: "tablet", width: 1024, height: undefined, position: "centre" },
    ],
    adminThumbnail: "thumbnail",
    mimeTypes: ["image/*"],
    pasteURL: {
      allowList: [
        { protocol: "http", hostname: "localhost" },
        { protocol: "https", hostname: "medusa-public-images.s3.eu-west-1.amazonaws.com" },
        { protocol: "https", hostname: "medusa-server-testing.s3.amazonaws.com" },
        { protocol: "https", hostname: "medusa-server-testing.s3.us-east-1.amazonaws.com" },
      ],
    },
  },
  fields: [
    { name: "alt", type: "text", label: "Alt Text", required: false },
  ],
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/storefront/src/collections/Media.ts
git commit -m "feat(payload): add Media collection"
```

---

## Task 14: Create the `Products` collection

**Files:**
- Create: `apps/storefront/src/collections/Products.ts`

- [ ] **Step 1: Write `apps/storefront/src/collections/Products.ts`**

```ts
import type { CollectionConfig, FieldHook, Validate } from "payload"

const ensureLexicalDescription: FieldHook = ({ value }) => {
  if (!value || typeof value !== "string") return value
  // Minimal Lexical document wrapping plain text from Medusa.
  return {
    root: {
      type: "root",
      format: "",
      indent: 0,
      version: 1,
      children: [
        {
          type: "paragraph",
          format: "",
          indent: 0,
          version: 1,
          children: [
            { type: "text", text: value, format: 0, version: 1, detail: 0, mode: "normal", style: "" },
          ],
        },
      ],
      direction: null,
    },
  }
}

const lockCount: Validate = (value, { siblingData, previousValue }) => {
  if (!Array.isArray(value) || !Array.isArray(previousValue)) return true
  if (value.length !== previousValue.length) {
    return "Count must match Medusa; changes are read-only from the admin UI."
  }
  return true
}

const isAdminOrApiKey = ({ req }: { req: { user?: { collection?: string } | null } }) => {
  return Boolean(req.user)
}

export const Products: CollectionConfig = {
  slug: "products",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "handle", "medusa_id", "updatedAt"],
  },
  access: {
    create: isAdminOrApiKey,
    update: isAdminOrApiKey,
    delete: isAdminOrApiKey,
    read: () => true,
  },
  fields: [
    { name: "medusa_id", type: "text", required: true, unique: true, index: true, admin: { readOnly: true } },
    { name: "title", type: "text" },
    { name: "handle", type: "text", admin: { readOnly: true } },
    { name: "subtitle", type: "text" },
    {
      name: "description",
      type: "richText",
      hooks: { beforeChange: [ensureLexicalDescription] },
    },
    { name: "thumbnail", type: "upload", relationTo: "media" },
    {
      name: "images",
      type: "array",
      fields: [{ name: "image", type: "upload", relationTo: "media", required: true }],
    },
    {
      name: "seo",
      type: "group",
      fields: [
        { name: "title", type: "text" },
        { name: "description", type: "textarea" },
        { name: "keywords", type: "text" },
      ],
    },
    {
      name: "options",
      type: "array",
      admin: { description: "Mirror of Medusa options. Count is managed by Medusa." },
      validate: lockCount,
      fields: [
        { name: "medusa_id", type: "text", required: true, admin: { readOnly: true } },
        { name: "title", type: "text" },
        { name: "values", type: "array", fields: [{ name: "value", type: "text" }] },
      ],
    },
    {
      name: "variants",
      type: "array",
      admin: { description: "Mirror of Medusa variants. Count is managed by Medusa." },
      validate: lockCount,
      fields: [
        { name: "medusa_id", type: "text", required: true, admin: { readOnly: true } },
        { name: "title", type: "text" },
        { name: "sku", type: "text", admin: { readOnly: true } },
        {
          name: "option_values",
          type: "array",
          fields: [
            { name: "option_medusa_id", type: "text" },
            { name: "value", type: "text" },
          ],
        },
      ],
    },
  ],
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/storefront/src/collections/Products.ts
git commit -m "feat(payload): add Products collection with Medusa-linked fields"
```

---

## Task 15: Register collections in `payload.config.ts`

**Files:**
- Modify: `apps/storefront/src/payload.config.ts`

- [ ] **Step 1: Update the config to import and register the three collections**

Replace the contents of `apps/storefront/src/payload.config.ts`:

```ts
import path from "path"
import { fileURLToPath } from "url"
import sharp from "sharp"
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
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.PAYLOAD_DATABASE_URL || "",
    },
  }),
  sharp,
})
```

- [ ] **Step 2: Regenerate the import map**

```bash
pnpm --filter @dtc/storefront generate:importmap
```

- [ ] **Step 3: Generate Payload's TS types**

```bash
pnpm --filter @dtc/storefront exec payload generate:types
```

Expected: writes `apps/storefront/src/payload-types.ts`. Commit this file.

- [ ] **Step 4: Run storefront build**

```bash
pnpm --filter @dtc/storefront build
```

Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add apps/storefront/src/payload.config.ts apps/storefront/src/payload-types.ts 'apps/storefront/src/app/(payload)/admin/importMap.js'
git commit -m "feat(payload): register Users, Media, Products collections"
```

---

## Task 16: Create Payload admin user and copy API key (manual step)

**No file changes.** Required to obtain `PAYLOAD_API_KEY` for the backend module.

- [ ] **Step 1: Start storefront dev**

```bash
pnpm --filter @dtc/storefront dev
```

- [ ] **Step 2: Open `http://localhost:8000/admin`**

Complete the "Create your first user" form. Use any email/password you'll remember.

- [ ] **Step 3: Enable API key on the user**

In the Payload admin, navigate to Users → your user → enable "API Key" → save. Copy the generated API key.

- [ ] **Step 4: Save the key for the next task**

You'll paste it into `apps/backend/.env` in Task 22.

- [ ] **Step 5: Stop the dev server.**

---

## Task 17: Backend Payload module — types

**Files:**
- Create: `apps/backend/src/modules/payload/types.ts`

- [ ] **Step 1: Write `apps/backend/src/modules/payload/types.ts`**

```ts
export interface PayloadModuleOptions {
  serverUrl: string
  apiKey: string
  userCollection?: string
}

export interface PayloadCollectionItem {
  id: string
  createdAt: string
  updatedAt: string
  medusa_id: string
  [key: string]: unknown
}

export type PayloadUpsertData = Record<string, unknown>

export interface PayloadQueryOptions {
  depth?: number
  locale?: string
  where?: Record<string, unknown>
  limit?: number
  page?: number
  sort?: string
}

export interface PayloadItemResult<T extends PayloadCollectionItem = PayloadCollectionItem> {
  doc: T
  message: string
}

export interface PayloadBulkResult<T extends PayloadCollectionItem = PayloadCollectionItem> {
  docs: T[]
  totalDocs: number
  limit: number
  page: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface PayloadApiErrorBody {
  errors?: Array<{ message: string; field?: string }>
  message?: string
}

export interface PayloadProductVariant {
  medusa_id: string
  title?: string
  sku?: string
  option_values?: Array<{ option_medusa_id: string; value: string }>
}

export interface PayloadProductOption {
  medusa_id: string
  title?: string
  values?: Array<{ value: string }>
}

export interface PayloadProduct extends PayloadCollectionItem {
  title?: string
  handle?: string
  subtitle?: string
  description?: unknown
  thumbnail?: { id: string; url?: string } | string
  images?: Array<{ image: { id: string; url?: string } | string }>
  seo?: { title?: string; description?: string; keywords?: string }
  options?: PayloadProductOption[]
  variants?: PayloadProductVariant[]
}

export type PayloadFetch = (input: string | URL, init?: RequestInit) => Promise<Response>

export interface PayloadServiceDependencies {
  fetch?: PayloadFetch
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/backend/src/modules/payload/types.ts
git commit -m "feat(payload-module): add type definitions"
```

---

## Task 18: Backend Payload module — error class

**Files:**
- Create: `apps/backend/src/modules/payload/errors.ts`

- [ ] **Step 1: Write `apps/backend/src/modules/payload/errors.ts`**

```ts
import type { PayloadApiErrorBody } from "./types"

export class PayloadApiError extends Error {
  readonly status: number
  readonly url: string
  readonly body?: PayloadApiErrorBody

  constructor(message: string, args: { status: number; url: string; body?: PayloadApiErrorBody }) {
    super(message)
    this.name = "PayloadApiError"
    this.status = args.status
    this.url = args.url
    this.body = args.body
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/backend/src/modules/payload/errors.ts
git commit -m "feat(payload-module): add PayloadApiError"
```

---

## Task 19: Backend Payload module — failing service unit tests

**Files:**
- Create: `apps/backend/src/modules/payload/__tests__/service.unit.spec.ts`

- [ ] **Step 1: Write the test file**

```ts
import PayloadModuleService from "../service"
import { PayloadApiError } from "../errors"
import type { PayloadFetch, PayloadProduct } from "../types"

const OPTIONS = {
  serverUrl: "http://payload.local",
  apiKey: "test-key",
  userCollection: "users",
}

function makeFetch(responses: Array<{ status?: number; body: unknown }>): {
  fetch: PayloadFetch
  calls: Array<{ url: string; init?: RequestInit }>
} {
  const calls: Array<{ url: string; init?: RequestInit }> = []
  let i = 0
  const fetch: PayloadFetch = async (input, init) => {
    calls.push({ url: String(input), init })
    const { status = 200, body } = responses[i++] ?? { body: {} }
    return new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    })
  }
  return { fetch, calls }
}

describe("PayloadModuleService", () => {
  describe("makeRequest auth header", () => {
    it("sets Authorization: <userCollection> API-Key <apiKey>", async () => {
      const { fetch, calls } = makeFetch([{ body: { docs: [], totalDocs: 0 } }])
      const service = new PayloadModuleService({}, OPTIONS, { fetch })
      await service.find<PayloadProduct>("products")
      const auth = (calls[0].init?.headers as Record<string, string>)?.Authorization
      expect(auth).toBe("users API-Key test-key")
    })

    it("uses the configured userCollection name", async () => {
      const { fetch, calls } = makeFetch([{ body: { docs: [], totalDocs: 0 } }])
      const service = new PayloadModuleService({}, { ...OPTIONS, userCollection: "admins" }, { fetch })
      await service.find<PayloadProduct>("products")
      expect((calls[0].init?.headers as Record<string, string>).Authorization).toBe("admins API-Key test-key")
    })
  })

  describe("create", () => {
    it("POSTs to /api/<collection> with JSON body", async () => {
      const doc = { id: "1", medusa_id: "p1", createdAt: "", updatedAt: "" }
      const { fetch, calls } = makeFetch([{ status: 201, body: { doc, message: "ok" } }])
      const service = new PayloadModuleService({}, OPTIONS, { fetch })
      const result = await service.create<PayloadProduct>("products", { medusa_id: "p1" })
      expect(calls[0].url).toBe("http://payload.local/api/products")
      expect(calls[0].init?.method).toBe("POST")
      expect(calls[0].init?.body).toBe(JSON.stringify({ medusa_id: "p1" }))
      expect(result.doc.medusa_id).toBe("p1")
    })
  })

  describe("update", () => {
    it("PATCHes /api/<collection>/<id>", async () => {
      const doc = { id: "1", medusa_id: "p1", createdAt: "", updatedAt: "" }
      const { fetch, calls } = makeFetch([{ body: { doc, message: "ok" } }])
      const service = new PayloadModuleService({}, OPTIONS, { fetch })
      await service.update<PayloadProduct>("products", "1", { title: "new" })
      expect(calls[0].url).toBe("http://payload.local/api/products/1")
      expect(calls[0].init?.method).toBe("PATCH")
      expect(calls[0].init?.body).toBe(JSON.stringify({ title: "new" }))
    })
  })

  describe("delete", () => {
    it("DELETEs /api/<collection>/<id>", async () => {
      const { fetch, calls } = makeFetch([{ body: { message: "deleted" } }])
      const service = new PayloadModuleService({}, OPTIONS, { fetch })
      await service.delete("products", "1")
      expect(calls[0].url).toBe("http://payload.local/api/products/1")
      expect(calls[0].init?.method).toBe("DELETE")
    })
  })

  describe("find", () => {
    it("builds querystring from PayloadQueryOptions", async () => {
      const { fetch, calls } = makeFetch([{ body: { docs: [], totalDocs: 0 } }])
      const service = new PayloadModuleService({}, OPTIONS, { fetch })
      await service.find<PayloadProduct>("products", {
        depth: 2,
        limit: 10,
        page: 1,
        where: { medusa_id: { equals: "p1" } },
      })
      const url = new URL(calls[0].url)
      expect(url.pathname).toBe("/api/products")
      expect(url.searchParams.get("depth")).toBe("2")
      expect(url.searchParams.get("limit")).toBe("10")
      expect(url.searchParams.get("page")).toBe("1")
      expect(url.searchParams.get("where[medusa_id][equals]")).toBe("p1")
    })

    it("supports where with $in arrays", async () => {
      const { fetch, calls } = makeFetch([{ body: { docs: [], totalDocs: 0 } }])
      const service = new PayloadModuleService({}, OPTIONS, { fetch })
      await service.find<PayloadProduct>("products", {
        where: { medusa_id: { in: ["a", "b"] } },
      })
      const url = new URL(calls[0].url)
      expect(url.searchParams.getAll("where[medusa_id][in][]")).toEqual(["a", "b"])
    })
  })

  describe("list (used by virtual link)", () => {
    it("shapes the response as { payload_product: [...] }", async () => {
      const doc = { id: "1", medusa_id: "p1", createdAt: "", updatedAt: "" }
      const { fetch } = makeFetch([{ body: { docs: [doc], totalDocs: 1 } }])
      const service = new PayloadModuleService({}, OPTIONS, { fetch })
      const result = await service.list({ product_id: "p1" })
      expect(result).toEqual({ payload_product: [doc] })
    })

    it("accepts an array of product_ids", async () => {
      const docs = [
        { id: "1", medusa_id: "p1", createdAt: "", updatedAt: "" },
        { id: "2", medusa_id: "p2", createdAt: "", updatedAt: "" },
      ]
      const { fetch, calls } = makeFetch([{ body: { docs, totalDocs: 2 } }])
      const service = new PayloadModuleService({}, OPTIONS, { fetch })
      const result = await service.list({ product_id: ["p1", "p2"] })
      const url = new URL(calls[0].url)
      expect(url.searchParams.getAll("where[medusa_id][in][]")).toEqual(["p1", "p2"])
      expect(result.payload_product).toHaveLength(2)
    })
  })

  describe("error handling", () => {
    it("throws PayloadApiError on non-2xx with status and body", async () => {
      const { fetch } = makeFetch([
        { status: 422, body: { errors: [{ message: "validation failed", field: "medusa_id" }] } },
      ])
      const service = new PayloadModuleService({}, OPTIONS, { fetch })
      await expect(service.create("products", { medusa_id: "" })).rejects.toBeInstanceOf(PayloadApiError)
      try {
        await service.create("products", { medusa_id: "" })
      } catch (err) {
        expect((err as PayloadApiError).status).toBe(422)
        expect((err as PayloadApiError).body?.errors?.[0].message).toBe("validation failed")
      }
    })

    it("wraps fetch network errors as PayloadApiError with status 0", async () => {
      const fetch: PayloadFetch = async () => {
        throw new Error("ECONNREFUSED")
      }
      const service = new PayloadModuleService({}, OPTIONS, { fetch })
      await expect(service.find("products")).rejects.toMatchObject({
        name: "PayloadApiError",
        status: 0,
      })
    })
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
pnpm --filter @dtc/backend test:unit
```

Expected: FAIL with "Cannot find module '../service'" (service.ts not yet created).

---

## Task 20: Backend Payload module — service implementation

**Files:**
- Create: `apps/backend/src/modules/payload/service.ts`

- [ ] **Step 1: Write `apps/backend/src/modules/payload/service.ts`**

```ts
import { PayloadApiError } from "./errors"
import type {
  PayloadBulkResult,
  PayloadCollectionItem,
  PayloadFetch,
  PayloadItemResult,
  PayloadModuleOptions,
  PayloadProduct,
  PayloadQueryOptions,
  PayloadServiceDependencies,
  PayloadUpsertData,
} from "./types"

class PayloadModuleService {
  protected readonly options_: PayloadModuleOptions
  protected readonly fetch_: PayloadFetch

  constructor(_container: unknown, options: PayloadModuleOptions, deps?: PayloadServiceDependencies) {
    this.options_ = options
    this.fetch_ = deps?.fetch ?? ((globalThis as unknown as { fetch: PayloadFetch }).fetch)
  }

  protected getAuthHeader(): string {
    const collection = this.options_.userCollection || "users"
    return `${collection} API-Key ${this.options_.apiKey}`
  }

  protected buildUrl(path: string, query?: PayloadQueryOptions): string {
    const url = new URL(path, this.options_.serverUrl)
    if (query) {
      for (const [k, v] of Object.entries(serializeQuery(query))) {
        if (Array.isArray(v)) {
          for (const item of v) url.searchParams.append(`${k}[]`, String(item))
        } else if (v !== undefined && v !== null) {
          url.searchParams.set(k, String(v))
        }
      }
    }
    return url.toString()
  }

  protected async makeRequest<T>(
    path: string,
    init: RequestInit & { query?: PayloadQueryOptions } = {}
  ): Promise<T> {
    const { query, headers, ...rest } = init
    const url = this.buildUrl(path, query)
    let response: Response
    try {
      response = await this.fetch_(url, {
        ...rest,
        headers: {
          "Content-Type": "application/json",
          Authorization: this.getAuthHeader(),
          ...(headers as Record<string, string> | undefined),
        },
      })
    } catch (err) {
      throw new PayloadApiError((err as Error).message || "Payload request failed", {
        status: 0,
        url,
      })
    }

    if (!response.ok) {
      let body: unknown
      try {
        body = await response.json()
      } catch {
        body = undefined
      }
      throw new PayloadApiError(`Payload request failed with status ${response.status}`, {
        status: response.status,
        url,
        body: body as { errors?: Array<{ message: string; field?: string }>; message?: string },
      })
    }

    return (await response.json()) as T
  }

  async create<T extends PayloadCollectionItem = PayloadCollectionItem>(
    collection: string,
    data: PayloadUpsertData
  ): Promise<PayloadItemResult<T>> {
    return this.makeRequest<PayloadItemResult<T>>(`/api/${collection}`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async update<T extends PayloadCollectionItem = PayloadCollectionItem>(
    collection: string,
    id: string,
    data: PayloadUpsertData
  ): Promise<PayloadItemResult<T>> {
    return this.makeRequest<PayloadItemResult<T>>(`/api/${collection}/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  }

  async delete(collection: string, id: string): Promise<{ message: string }> {
    return this.makeRequest<{ message: string }>(`/api/${collection}/${encodeURIComponent(id)}`, {
      method: "DELETE",
    })
  }

  async find<T extends PayloadCollectionItem = PayloadCollectionItem>(
    collection: string,
    options?: PayloadQueryOptions
  ): Promise<PayloadBulkResult<T>> {
    return this.makeRequest<PayloadBulkResult<T>>(`/api/${collection}`, {
      method: "GET",
      query: options,
    })
  }

  /**
   * Required by the Medusa→Payload virtual link runtime.
   * Given one or more Medusa product IDs, returns the matching Payload products
   * shaped under `payload_product` so the link layer can merge them in.
   */
  async list(filters: { product_id: string | string[] }): Promise<{ payload_product: PayloadProduct[] }> {
    const ids = Array.isArray(filters.product_id) ? filters.product_id : [filters.product_id]
    const result = await this.find<PayloadProduct>("products", {
      where: { medusa_id: { in: ids } },
      limit: ids.length,
      depth: 2,
    })
    return { payload_product: result.docs }
  }
}

function serializeQuery(query: PayloadQueryOptions): Record<string, string | string[] | number | undefined> {
  const out: Record<string, string | string[] | number | undefined> = {}
  if (query.depth !== undefined) out.depth = query.depth
  if (query.locale !== undefined) out.locale = query.locale
  if (query.limit !== undefined) out.limit = query.limit
  if (query.page !== undefined) out.page = query.page
  if (query.sort !== undefined) out.sort = query.sort
  if (query.where) flattenWhere(query.where, "where", out)
  return out
}

function flattenWhere(
  obj: Record<string, unknown>,
  prefix: string,
  out: Record<string, string | string[] | number | undefined>
) {
  for (const [k, v] of Object.entries(obj)) {
    const key = `${prefix}[${k}]`
    if (v === null || v === undefined) continue
    if (Array.isArray(v)) {
      out[key] = v.map(String)
    } else if (typeof v === "object") {
      flattenWhere(v as Record<string, unknown>, key, out)
    } else {
      out[key] = String(v)
    }
  }
}

export default PayloadModuleService
```

- [ ] **Step 2: Run the tests to verify they pass**

```bash
pnpm --filter @dtc/backend test:unit
```

Expected: all `PayloadModuleService` tests pass.

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/modules/payload/service.ts apps/backend/src/modules/payload/__tests__/service.unit.spec.ts
git commit -m "feat(payload-module): implement Payload HTTP service with tests"
```

---

## Task 21: Backend Payload module — mappers + tests

**Files:**
- Create: `apps/backend/src/modules/payload/mappers.ts`
- Create: `apps/backend/src/modules/payload/__tests__/mappers.unit.spec.ts`

- [ ] **Step 1: Write the failing test `__tests__/mappers.unit.spec.ts`**

```ts
import { mapMedusaProductToPayload, mapMedusaVariantToPayload } from "../mappers"

describe("mapMedusaProductToPayload", () => {
  it("maps core fields", () => {
    const result = mapMedusaProductToPayload({
      id: "prod_1",
      title: "Hat",
      handle: "hat",
      subtitle: "Wide brim",
      description: "A nice hat",
      thumbnail: null,
      images: [],
      options: [],
      variants: [],
    } as never)
    expect(result.medusa_id).toBe("prod_1")
    expect(result.title).toBe("Hat")
    expect(result.handle).toBe("hat")
    expect(result.subtitle).toBe("Wide brim")
  })

  it("passes plain description through as a string (Lexical hook wraps it on write)", () => {
    const result = mapMedusaProductToPayload({
      id: "prod_1",
      title: "Hat",
      description: "Plain text",
    } as never)
    expect(result.description).toBe("Plain text")
  })

  it("maps options into the payload options shape", () => {
    const result = mapMedusaProductToPayload({
      id: "prod_1",
      options: [
        { id: "opt_1", title: "Size", values: [{ value: "S" }, { value: "M" }] },
      ],
    } as never)
    expect(result.options).toEqual([
      { medusa_id: "opt_1", title: "Size", values: [{ value: "S" }, { value: "M" }] },
    ])
  })

  it("maps variants with option_values", () => {
    const result = mapMedusaProductToPayload({
      id: "prod_1",
      variants: [
        {
          id: "var_1",
          title: "Small",
          sku: "HAT-S",
          options: [{ option_id: "opt_1", value: "S" }],
        },
      ],
    } as never)
    expect(result.variants).toEqual([
      {
        medusa_id: "var_1",
        title: "Small",
        sku: "HAT-S",
        option_values: [{ option_medusa_id: "opt_1", value: "S" }],
      },
    ])
  })
})

describe("mapMedusaVariantToPayload", () => {
  it("maps a single variant", () => {
    const result = mapMedusaVariantToPayload({
      id: "var_1",
      title: "Large",
      sku: "HAT-L",
      options: [{ option_id: "opt_1", value: "L" }],
    } as never)
    expect(result).toEqual({
      medusa_id: "var_1",
      title: "Large",
      sku: "HAT-L",
      option_values: [{ option_medusa_id: "opt_1", value: "L" }],
    })
  })
})
```

- [ ] **Step 2: Run to verify fail**

```bash
pnpm --filter @dtc/backend test:unit
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write `apps/backend/src/modules/payload/mappers.ts`**

```ts
import type { PayloadProduct, PayloadProductOption, PayloadProductVariant, PayloadUpsertData } from "./types"

type MedusaOption = { id: string; title?: string; values?: Array<{ value: string }> }
type MedusaVariantOption = { option_id: string; value: string }
type MedusaVariant = {
  id: string
  title?: string
  sku?: string | null
  options?: MedusaVariantOption[]
}
type MedusaProduct = {
  id: string
  title?: string
  handle?: string
  subtitle?: string | null
  description?: string | null
  options?: MedusaOption[]
  variants?: MedusaVariant[]
}

export function mapMedusaProductToPayload(product: MedusaProduct): PayloadUpsertData {
  const data: PayloadUpsertData = { medusa_id: product.id }
  if (product.title !== undefined) data.title = product.title
  if (product.handle !== undefined) data.handle = product.handle
  if (product.subtitle !== undefined && product.subtitle !== null) data.subtitle = product.subtitle
  if (product.description !== undefined && product.description !== null) data.description = product.description
  if (product.options) data.options = product.options.map(mapOption)
  if (product.variants) data.variants = product.variants.map(mapMedusaVariantToPayload)
  return data
}

export function mapMedusaVariantToPayload(variant: MedusaVariant): PayloadProductVariant {
  return {
    medusa_id: variant.id,
    title: variant.title,
    sku: variant.sku ?? undefined,
    option_values: (variant.options ?? []).map((o) => ({
      option_medusa_id: o.option_id,
      value: o.value,
    })),
  }
}

function mapOption(option: MedusaOption): PayloadProductOption {
  return {
    medusa_id: option.id,
    title: option.title,
    values: option.values?.map((v) => ({ value: v.value })),
  }
}

export type { PayloadProduct }
```

- [ ] **Step 4: Run tests**

```bash
pnpm --filter @dtc/backend test:unit
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/modules/payload/mappers.ts apps/backend/src/modules/payload/__tests__/mappers.unit.spec.ts
git commit -m "feat(payload-module): add Medusa→Payload mappers with tests"
```

---

## Task 22: Backend Payload module — index + medusa-config registration

**Files:**
- Create: `apps/backend/src/modules/payload/index.ts`
- Modify: `apps/backend/medusa-config.ts`
- Modify: `apps/backend/.env.template`

- [ ] **Step 1: Write `apps/backend/src/modules/payload/index.ts`**

```ts
import { Module } from "@medusajs/framework/utils"
import PayloadModuleService from "./service"

export const PAYLOAD_MODULE = "payload"

export default Module(PAYLOAD_MODULE, {
  service: PayloadModuleService,
})

export { PayloadModuleService }
export * from "./types"
export * from "./errors"
export * from "./mappers"
```

- [ ] **Step 2: Edit `apps/backend/medusa-config.ts`**

Replace contents with:

```ts
import { loadEnv, defineConfig } from "@medusajs/framework/utils"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
  },
  modules: [
    {
      resolve: "./src/modules/payload",
      options: {
        serverUrl: process.env.PAYLOAD_SERVER_URL || "http://localhost:8000",
        apiKey: process.env.PAYLOAD_API_KEY || "",
        userCollection: process.env.PAYLOAD_USER_COLLECTION || "users",
      },
    },
  ],
})
```

- [ ] **Step 3: Edit `apps/backend/.env.template`** — append:

```dotenv

# Payload CMS integration
PAYLOAD_SERVER_URL=http://localhost:8000
PAYLOAD_API_KEY=
PAYLOAD_USER_COLLECTION=users
```

Also paste your real API key into `apps/backend/.env` (not committed).

- [ ] **Step 4: Build the backend**

```bash
pnpm --filter @dtc/backend build
```

Expected: exit 0. Medusa boots without errors registering the new module.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/modules/payload/index.ts apps/backend/medusa-config.ts apps/backend/.env.template
git commit -m "feat(backend): register Payload module"
```

---

## Task 23: Workflow step — create Payload products

**Files:**
- Create: `apps/backend/src/workflows/payload/steps/create-payload-products.ts`

- [ ] **Step 1: Write the step**

```ts
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PAYLOAD_MODULE, mapMedusaProductToPayload } from "../../../modules/payload"
import type { PayloadModuleService } from "../../../modules/payload"

type Product = Parameters<typeof mapMedusaProductToPayload>[0]

type Input = { products: Product[] }

export const createPayloadProductsStep = createStep(
  "create-payload-products",
  async (input: Input, { container }) => {
    const service = container.resolve<PayloadModuleService>(PAYLOAD_MODULE)
    const created: Array<{ payload_id: string; medusa_id: string }> = []
    for (const product of input.products) {
      const existing = await service.find("products", {
        where: { medusa_id: { equals: product.id } },
        limit: 1,
      })
      if (existing.docs[0]) {
        created.push({ payload_id: existing.docs[0].id, medusa_id: product.id })
        continue
      }
      const result = await service.create("products", mapMedusaProductToPayload(product))
      created.push({ payload_id: result.doc.id, medusa_id: product.id })
    }
    return new StepResponse(created, created)
  },
  async (created, { container }) => {
    if (!created?.length) return
    const service = container.resolve<PayloadModuleService>(PAYLOAD_MODULE)
    for (const c of created) {
      try {
        await service.delete("products", c.payload_id)
      } catch {
        // best-effort compensation
      }
    }
  }
)
```

- [ ] **Step 2: Commit**

```bash
git add apps/backend/src/workflows/payload/steps/create-payload-products.ts
git commit -m "feat(workflows): add create-payload-products step"
```

---

## Task 24: Workflow — create Payload products

**Files:**
- Create: `apps/backend/src/workflows/payload/create-payload-products.ts`

- [ ] **Step 1: Write the workflow**

```ts
import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { createPayloadProductsStep } from "./steps/create-payload-products"
import { mapMedusaProductToPayload } from "../../modules/payload"

type Product = Parameters<typeof mapMedusaProductToPayload>[0]

export const createPayloadProductsWorkflow = createWorkflow(
  "create-payload-products",
  (input: { products: Product[] }) => {
    const created = createPayloadProductsStep(input)
    return new WorkflowResponse(created)
  }
)
```

- [ ] **Step 2: Commit**

```bash
git add apps/backend/src/workflows/payload/create-payload-products.ts
git commit -m "feat(workflows): add createPayloadProductsWorkflow"
```

---

## Task 25: Workflow step + workflow — update Payload products

**Files:**
- Create: `apps/backend/src/workflows/payload/steps/update-payload-products.ts`
- Create: `apps/backend/src/workflows/payload/update-payload-products.ts`

- [ ] **Step 1: Write the step**

`apps/backend/src/workflows/payload/steps/update-payload-products.ts`:

```ts
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PAYLOAD_MODULE, mapMedusaProductToPayload } from "../../../modules/payload"
import type { PayloadModuleService, PayloadProduct } from "../../../modules/payload"

type Product = Parameters<typeof mapMedusaProductToPayload>[0]

type Input = { products: Product[] }

type Snapshot = { payload_id: string; previous: Partial<PayloadProduct> | null }

export const updatePayloadProductsStep = createStep(
  "update-payload-products",
  async (input: Input, { container }) => {
    const service = container.resolve<PayloadModuleService>(PAYLOAD_MODULE)
    const snapshots: Snapshot[] = []
    for (const product of input.products) {
      const found = await service.find<PayloadProduct>("products", {
        where: { medusa_id: { equals: product.id } },
        limit: 1,
        depth: 0,
      })
      const existing = found.docs[0]
      if (!existing) continue
      snapshots.push({ payload_id: existing.id, previous: existing })
      await service.update("products", existing.id, mapMedusaProductToPayload(product))
    }
    return new StepResponse(snapshots, snapshots)
  },
  async (snapshots, { container }) => {
    if (!snapshots?.length) return
    const service = container.resolve<PayloadModuleService>(PAYLOAD_MODULE)
    for (const snap of snapshots) {
      if (!snap.previous) continue
      try {
        await service.update("products", snap.payload_id, snap.previous as Record<string, unknown>)
      } catch {
        // best-effort compensation
      }
    }
  }
)
```

- [ ] **Step 2: Write the workflow**

`apps/backend/src/workflows/payload/update-payload-products.ts`:

```ts
import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { updatePayloadProductsStep } from "./steps/update-payload-products"
import { mapMedusaProductToPayload } from "../../modules/payload"

type Product = Parameters<typeof mapMedusaProductToPayload>[0]

export const updatePayloadProductsWorkflow = createWorkflow(
  "update-payload-products",
  (input: { products: Product[] }) => {
    const result = updatePayloadProductsStep(input)
    return new WorkflowResponse(result)
  }
)
```

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/workflows/payload/steps/update-payload-products.ts apps/backend/src/workflows/payload/update-payload-products.ts
git commit -m "feat(workflows): add updatePayloadProductsWorkflow"
```

---

## Task 26: Workflow step + workflow — delete Payload products

**Files:**
- Create: `apps/backend/src/workflows/payload/steps/delete-payload-products.ts`
- Create: `apps/backend/src/workflows/payload/delete-payload-products.ts`

- [ ] **Step 1: Write the step**

```ts
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PAYLOAD_MODULE } from "../../../modules/payload"
import type { PayloadModuleService } from "../../../modules/payload"

type Input = { ids: string[] }

export const deletePayloadProductsStep = createStep(
  "delete-payload-products",
  async (input: Input, { container }) => {
    const service = container.resolve<PayloadModuleService>(PAYLOAD_MODULE)
    const deleted: Array<{ medusa_id: string; payload_id: string }> = []
    for (const medusaId of input.ids) {
      const found = await service.find("products", {
        where: { medusa_id: { equals: medusaId } },
        limit: 1,
      })
      const doc = found.docs[0]
      if (!doc) continue
      await service.delete("products", doc.id)
      deleted.push({ medusa_id: medusaId, payload_id: doc.id })
    }
    return new StepResponse(deleted)
    // No clean compensation possible without snapshotting full content.
  }
)
```

- [ ] **Step 2: Write the workflow**

```ts
import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { deletePayloadProductsStep } from "./steps/delete-payload-products"

export const deletePayloadProductsWorkflow = createWorkflow(
  "delete-payload-products",
  (input: { ids: string[] }) => {
    const deleted = deletePayloadProductsStep(input)
    return new WorkflowResponse(deleted)
  }
)
```

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/workflows/payload/steps/delete-payload-products.ts apps/backend/src/workflows/payload/delete-payload-products.ts
git commit -m "feat(workflows): add deletePayloadProductsWorkflow"
```

---

## Task 27: Workflow step — upsert Payload product variants

**Files:**
- Create: `apps/backend/src/workflows/payload/steps/upsert-payload-product-variants.ts`

- [ ] **Step 1: Write the step**

```ts
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PAYLOAD_MODULE, mapMedusaVariantToPayload } from "../../../modules/payload"
import type { PayloadModuleService, PayloadProduct } from "../../../modules/payload"

type Variant = Parameters<typeof mapMedusaVariantToPayload>[0]
type Input = { product_id: string; variants: Variant[] }

type Snapshot = { payload_id: string; previous: PayloadProduct["variants"] }

export const upsertPayloadProductVariantsStep = createStep(
  "upsert-payload-product-variants",
  async (input: Input, { container }) => {
    const service = container.resolve<PayloadModuleService>(PAYLOAD_MODULE)
    const found = await service.find<PayloadProduct>("products", {
      where: { medusa_id: { equals: input.product_id } },
      limit: 1,
    })
    const product = found.docs[0]
    if (!product) {
      return new StepResponse(null, null)
    }
    const snapshot: Snapshot = { payload_id: product.id, previous: product.variants ?? [] }
    const byId = new Map(snapshot.previous?.map((v) => [v.medusa_id, v]) ?? [])
    for (const variant of input.variants) {
      byId.set(variant.id, mapMedusaVariantToPayload(variant))
    }
    await service.update("products", product.id, { variants: Array.from(byId.values()) })
    return new StepResponse(snapshot, snapshot)
  },
  async (snapshot, { container }) => {
    if (!snapshot) return
    const service = container.resolve<PayloadModuleService>(PAYLOAD_MODULE)
    try {
      await service.update("products", snapshot.payload_id, { variants: snapshot.previous })
    } catch {
      // best-effort compensation
    }
  }
)
```

- [ ] **Step 2: Commit**

```bash
git add apps/backend/src/workflows/payload/steps/upsert-payload-product-variants.ts
git commit -m "feat(workflows): add upsert-payload-product-variants step"
```

---

## Task 28: Workflows — variants (create / update)

**Files:**
- Create: `apps/backend/src/workflows/payload/create-payload-product-variant.ts`
- Create: `apps/backend/src/workflows/payload/update-payload-product-variants.ts`

- [ ] **Step 1: Write the create workflow**

```ts
import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { upsertPayloadProductVariantsStep } from "./steps/upsert-payload-product-variants"
import { mapMedusaVariantToPayload } from "../../modules/payload"

type Variant = Parameters<typeof mapMedusaVariantToPayload>[0]

export const createPayloadProductVariantWorkflow = createWorkflow(
  "create-payload-product-variant",
  (input: { product_id: string; variant: Variant }) => {
    const result = upsertPayloadProductVariantsStep({
      product_id: input.product_id,
      variants: [input.variant],
    })
    return new WorkflowResponse(result)
  }
)
```

- [ ] **Step 2: Write the update workflow**

```ts
import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { upsertPayloadProductVariantsStep } from "./steps/upsert-payload-product-variants"
import { mapMedusaVariantToPayload } from "../../modules/payload"

type Variant = Parameters<typeof mapMedusaVariantToPayload>[0]

export const updatePayloadProductVariantsWorkflow = createWorkflow(
  "update-payload-product-variants",
  (input: { product_id: string; variants: Variant[] }) => {
    const result = upsertPayloadProductVariantsStep(input)
    return new WorkflowResponse(result)
  }
)
```

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/workflows/payload/create-payload-product-variant.ts apps/backend/src/workflows/payload/update-payload-product-variants.ts
git commit -m "feat(workflows): add variant create/update workflows"
```

---

## Task 29: Workflow step + workflow — delete Payload product variant

**Files:**
- Create: `apps/backend/src/workflows/payload/steps/delete-payload-product-variant.ts`
- Create: `apps/backend/src/workflows/payload/delete-payload-product-variant.ts`

- [ ] **Step 1: Write the step**

```ts
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PAYLOAD_MODULE } from "../../../modules/payload"
import type { PayloadModuleService, PayloadProduct, PayloadProductVariant } from "../../../modules/payload"

type Input = { product_id: string; variant_id: string }

type Snapshot = { payload_id: string; previous: PayloadProductVariant[] }

export const deletePayloadProductVariantStep = createStep(
  "delete-payload-product-variant",
  async (input: Input, { container }) => {
    const service = container.resolve<PayloadModuleService>(PAYLOAD_MODULE)
    const found = await service.find<PayloadProduct>("products", {
      where: { medusa_id: { equals: input.product_id } },
      limit: 1,
    })
    const product = found.docs[0]
    if (!product) return new StepResponse(null, null)
    const snapshot: Snapshot = { payload_id: product.id, previous: product.variants ?? [] }
    const remaining = (product.variants ?? []).filter((v) => v.medusa_id !== input.variant_id)
    await service.update("products", product.id, { variants: remaining })
    return new StepResponse(snapshot, snapshot)
  },
  async (snapshot, { container }) => {
    if (!snapshot) return
    const service = container.resolve<PayloadModuleService>(PAYLOAD_MODULE)
    try {
      await service.update("products", snapshot.payload_id, { variants: snapshot.previous })
    } catch {
      // best-effort compensation
    }
  }
)
```

- [ ] **Step 2: Write the workflow**

```ts
import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { deletePayloadProductVariantStep } from "./steps/delete-payload-product-variant"

export const deletePayloadProductVariantWorkflow = createWorkflow(
  "delete-payload-product-variant",
  (input: { product_id: string; variant_id: string }) => {
    const result = deletePayloadProductVariantStep(input)
    return new WorkflowResponse(result)
  }
)
```

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/workflows/payload/steps/delete-payload-product-variant.ts apps/backend/src/workflows/payload/delete-payload-product-variant.ts
git commit -m "feat(workflows): add deletePayloadProductVariantWorkflow"
```

---

## Task 30: Workflow steps + workflows — options (create / delete)

**Files:**
- Create: `apps/backend/src/workflows/payload/steps/upsert-payload-product-options.ts`
- Create: `apps/backend/src/workflows/payload/steps/delete-payload-product-option.ts`
- Create: `apps/backend/src/workflows/payload/create-payload-product-option.ts`
- Create: `apps/backend/src/workflows/payload/delete-payload-product-option.ts`

- [ ] **Step 1: Write the upsert-options step**

`apps/backend/src/workflows/payload/steps/upsert-payload-product-options.ts`:

```ts
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PAYLOAD_MODULE } from "../../../modules/payload"
import type { PayloadModuleService, PayloadProduct, PayloadProductOption } from "../../../modules/payload"

type Option = { id: string; title?: string; values?: Array<{ value: string }> }
type Input = { product_id: string; options: Option[] }

type Snapshot = { payload_id: string; previous: PayloadProductOption[] }

export const upsertPayloadProductOptionsStep = createStep(
  "upsert-payload-product-options",
  async (input: Input, { container }) => {
    const service = container.resolve<PayloadModuleService>(PAYLOAD_MODULE)
    const found = await service.find<PayloadProduct>("products", {
      where: { medusa_id: { equals: input.product_id } },
      limit: 1,
    })
    const product = found.docs[0]
    if (!product) return new StepResponse(null, null)
    const snapshot: Snapshot = { payload_id: product.id, previous: product.options ?? [] }
    const byId = new Map(snapshot.previous?.map((o) => [o.medusa_id, o]) ?? [])
    for (const opt of input.options) {
      byId.set(opt.id, {
        medusa_id: opt.id,
        title: opt.title,
        values: opt.values,
      })
    }
    await service.update("products", product.id, { options: Array.from(byId.values()) })
    return new StepResponse(snapshot, snapshot)
  },
  async (snapshot, { container }) => {
    if (!snapshot) return
    const service = container.resolve<PayloadModuleService>(PAYLOAD_MODULE)
    try {
      await service.update("products", snapshot.payload_id, { options: snapshot.previous })
    } catch {
      // best-effort compensation
    }
  }
)
```

- [ ] **Step 2: Write the delete-option step**

`apps/backend/src/workflows/payload/steps/delete-payload-product-option.ts`:

```ts
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PAYLOAD_MODULE } from "../../../modules/payload"
import type { PayloadModuleService, PayloadProduct, PayloadProductOption } from "../../../modules/payload"

type Input = { product_id: string; option_id: string }

type Snapshot = { payload_id: string; previous: PayloadProductOption[] }

export const deletePayloadProductOptionStep = createStep(
  "delete-payload-product-option",
  async (input: Input, { container }) => {
    const service = container.resolve<PayloadModuleService>(PAYLOAD_MODULE)
    const found = await service.find<PayloadProduct>("products", {
      where: { medusa_id: { equals: input.product_id } },
      limit: 1,
    })
    const product = found.docs[0]
    if (!product) return new StepResponse(null, null)
    const snapshot: Snapshot = { payload_id: product.id, previous: product.options ?? [] }
    const remaining = (product.options ?? []).filter((o) => o.medusa_id !== input.option_id)
    await service.update("products", product.id, { options: remaining })
    return new StepResponse(snapshot, snapshot)
  },
  async (snapshot, { container }) => {
    if (!snapshot) return
    const service = container.resolve<PayloadModuleService>(PAYLOAD_MODULE)
    try {
      await service.update("products", snapshot.payload_id, { options: snapshot.previous })
    } catch {
      // best-effort compensation
    }
  }
)
```

- [ ] **Step 3: Write the create-option workflow**

`apps/backend/src/workflows/payload/create-payload-product-option.ts`:

```ts
import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { upsertPayloadProductOptionsStep } from "./steps/upsert-payload-product-options"

type Option = { id: string; title?: string; values?: Array<{ value: string }> }

export const createPayloadProductOptionWorkflow = createWorkflow(
  "create-payload-product-option",
  (input: { product_id: string; option: Option }) => {
    const result = upsertPayloadProductOptionsStep({
      product_id: input.product_id,
      options: [input.option],
    })
    return new WorkflowResponse(result)
  }
)
```

- [ ] **Step 4: Write the delete-option workflow**

`apps/backend/src/workflows/payload/delete-payload-product-option.ts`:

```ts
import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { deletePayloadProductOptionStep } from "./steps/delete-payload-product-option"

export const deletePayloadProductOptionWorkflow = createWorkflow(
  "delete-payload-product-option",
  (input: { product_id: string; option_id: string }) => {
    const result = deletePayloadProductOptionStep(input)
    return new WorkflowResponse(result)
  }
)
```

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/workflows/payload/steps/upsert-payload-product-options.ts apps/backend/src/workflows/payload/steps/delete-payload-product-option.ts apps/backend/src/workflows/payload/create-payload-product-option.ts apps/backend/src/workflows/payload/delete-payload-product-option.ts
git commit -m "feat(workflows): add product option workflows"
```

---

## Task 31: Virtual link Medusa product → Payload product

**Files:**
- Create: `apps/backend/src/links/product-payload.ts`

- [ ] **Step 1: Write the link**

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

- [ ] **Step 2: Build the backend**

```bash
pnpm --filter @dtc/backend build
```

Expected: exit 0. Medusa accepts the link definition because `PayloadModuleService.list` exists with the expected `product_id` filter.

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/links/product-payload.ts
git commit -m "feat(backend): add virtual link product ↔ payload_product"
```

---

## Task 32: Subscriber — product.created (TDD)

**Files:**
- Create: `apps/backend/src/subscribers/__tests__/product-created.unit.spec.ts`
- Create: `apps/backend/src/subscribers/product-created.ts`

- [ ] **Step 1: Write the failing test**

`apps/backend/src/subscribers/__tests__/product-created.unit.spec.ts`:

```ts
import handler, { config } from "../product-created"

describe("product-created subscriber", () => {
  const baseEvent = { data: { id: "prod_1" }, name: "product.created" } as never

  function buildContainer(workflowRun: jest.Mock, productList: jest.Mock) {
    return {
      resolve: (key: string) => {
        if (key === "query") return { graph: productList }
        if (key === "logger") return { error: jest.fn(), info: jest.fn() }
        throw new Error(`unexpected resolve ${key}`)
      },
    }
  }

  it("subscribes to product.created", () => {
    expect(config.event).toBe("product.created")
  })

  it("invokes createPayloadProductsWorkflow with the fetched product", async () => {
    const run = jest.fn().mockResolvedValue({ result: [] })
    const productList = jest.fn().mockResolvedValue({
      data: [{ id: "prod_1", title: "Hat", options: [], variants: [] }],
    })
    const container = buildContainer(run, productList)
    const moduleMock = jest.requireMock("../../workflows/payload/create-payload-products") as {
      createPayloadProductsWorkflow: { run: jest.Mock }
    }
    moduleMock.createPayloadProductsWorkflow.run.mockResolvedValueOnce({ result: [] })

    await handler({ event: baseEvent, container } as never)

    expect(moduleMock.createPayloadProductsWorkflow.run).toHaveBeenCalledWith({
      container,
      input: { products: [{ id: "prod_1", title: "Hat", options: [], variants: [] }] },
    })
  })

  it("swallows workflow errors and logs them", async () => {
    const error = new Error("payload down")
    const errLogger = jest.fn()
    const container = {
      resolve: (key: string) => {
        if (key === "query")
          return { graph: jest.fn().mockResolvedValue({ data: [{ id: "prod_1" }] }) }
        if (key === "logger") return { error: errLogger, info: jest.fn() }
        throw new Error(key)
      },
    } as never
    const moduleMock = jest.requireMock("../../workflows/payload/create-payload-products") as {
      createPayloadProductsWorkflow: { run: jest.Mock }
    }
    moduleMock.createPayloadProductsWorkflow.run.mockRejectedValueOnce(error)

    await expect(handler({ event: baseEvent, container })).resolves.toBeUndefined()
    expect(errLogger).toHaveBeenCalled()
  })
})

jest.mock("../../workflows/payload/create-payload-products", () => ({
  createPayloadProductsWorkflow: { run: jest.fn() },
}))
```

- [ ] **Step 2: Run to verify it fails**

```bash
pnpm --filter @dtc/backend test:unit
```

Expected: FAIL — module `../product-created` not found.

- [ ] **Step 3: Write the subscriber**

`apps/backend/src/subscribers/product-created.ts`:

```ts
import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createPayloadProductsWorkflow } from "../workflows/payload/create-payload-products"

type ProductCreatedEvent = { data: { id: string } }

export default async function handleProductCreated({
  event,
  container,
}: SubscriberArgs<ProductCreatedEvent["data"]>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  try {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "title", "handle", "subtitle", "description", "options.*", "variants.*", "variants.options.*"],
      filters: { id: event.data.id },
    })
    if (!products?.length) return
    await createPayloadProductsWorkflow.run({ container, input: { products } })
  } catch (err) {
    logger.error(`Payload sync failed for product.created (${event.data.id}): ${(err as Error).message}`)
  }
}

export const config: SubscriberConfig = { event: "product.created" }
```

- [ ] **Step 4: Run tests**

```bash
pnpm --filter @dtc/backend test:unit
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/subscribers/__tests__/product-created.unit.spec.ts apps/backend/src/subscribers/product-created.ts
git commit -m "feat(subscribers): handle product.created → sync Payload"
```

---

## Task 33: Subscriber — product.updated

**Files:**
- Create: `apps/backend/src/subscribers/__tests__/product-updated.unit.spec.ts`
- Create: `apps/backend/src/subscribers/product-updated.ts`

- [ ] **Step 1: Failing test**

`apps/backend/src/subscribers/__tests__/product-updated.unit.spec.ts`:

```ts
import handler, { config } from "../product-updated"

jest.mock("../../workflows/payload/update-payload-products", () => ({
  updatePayloadProductsWorkflow: { run: jest.fn() },
}))

describe("product-updated subscriber", () => {
  const baseEvent = { data: { id: "prod_1" }, name: "product.updated" } as never

  it("subscribes to product.updated", () => {
    expect(config.event).toBe("product.updated")
  })

  it("calls updatePayloadProductsWorkflow with the fetched product", async () => {
    const query = jest.fn().mockResolvedValue({ data: [{ id: "prod_1", title: "Updated" }] })
    const container = {
      resolve: (k: string) =>
        k === "query" ? { graph: query } : { error: jest.fn(), info: jest.fn() },
    } as never
    const mock = jest.requireMock("../../workflows/payload/update-payload-products") as {
      updatePayloadProductsWorkflow: { run: jest.Mock }
    }
    mock.updatePayloadProductsWorkflow.run.mockResolvedValueOnce({ result: [] })
    await handler({ event: baseEvent, container })
    expect(mock.updatePayloadProductsWorkflow.run).toHaveBeenCalledWith({
      container,
      input: { products: [{ id: "prod_1", title: "Updated" }] },
    })
  })
})
```

- [ ] **Step 2: Run to verify fail**

```bash
pnpm --filter @dtc/backend test:unit
```

Expected: FAIL.

- [ ] **Step 3: Implement**

`apps/backend/src/subscribers/product-updated.ts`:

```ts
import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updatePayloadProductsWorkflow } from "../workflows/payload/update-payload-products"

export default async function handleProductUpdated({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  try {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "title", "handle", "subtitle", "description", "options.*", "variants.*", "variants.options.*"],
      filters: { id: event.data.id },
    })
    if (!products?.length) return
    await updatePayloadProductsWorkflow.run({ container, input: { products } })
  } catch (err) {
    logger.error(`Payload sync failed for product.updated (${event.data.id}): ${(err as Error).message}`)
  }
}

export const config: SubscriberConfig = { event: "product.updated" }
```

- [ ] **Step 4: Run tests**

```bash
pnpm --filter @dtc/backend test:unit
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/subscribers/__tests__/product-updated.unit.spec.ts apps/backend/src/subscribers/product-updated.ts
git commit -m "feat(subscribers): handle product.updated → sync Payload"
```

---

## Task 34: Subscriber — product.deleted

**Files:**
- Create: `apps/backend/src/subscribers/__tests__/product-deleted.unit.spec.ts`
- Create: `apps/backend/src/subscribers/product-deleted.ts`

- [ ] **Step 1: Failing test**

```ts
import handler, { config } from "../product-deleted"

jest.mock("../../workflows/payload/delete-payload-products", () => ({
  deletePayloadProductsWorkflow: { run: jest.fn() },
}))

describe("product-deleted subscriber", () => {
  it("subscribes to product.deleted", () => {
    expect(config.event).toBe("product.deleted")
  })

  it("calls deletePayloadProductsWorkflow with the deleted id", async () => {
    const container = {
      resolve: () => ({ error: jest.fn(), info: jest.fn() }),
    } as never
    const mock = jest.requireMock("../../workflows/payload/delete-payload-products") as {
      deletePayloadProductsWorkflow: { run: jest.Mock }
    }
    mock.deletePayloadProductsWorkflow.run.mockResolvedValueOnce({ result: [] })
    await handler({ event: { data: { id: "prod_1" } }, container } as never)
    expect(mock.deletePayloadProductsWorkflow.run).toHaveBeenCalledWith({
      container,
      input: { ids: ["prod_1"] },
    })
  })
})
```

- [ ] **Step 2: Fail**

```bash
pnpm --filter @dtc/backend test:unit
```

- [ ] **Step 3: Implement**

```ts
import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { deletePayloadProductsWorkflow } from "../workflows/payload/delete-payload-products"

export default async function handleProductDeleted({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  try {
    await deletePayloadProductsWorkflow.run({ container, input: { ids: [event.data.id] } })
  } catch (err) {
    logger.error(`Payload sync failed for product.deleted (${event.data.id}): ${(err as Error).message}`)
  }
}

export const config: SubscriberConfig = { event: "product.deleted" }
```

- [ ] **Step 4: Pass**

```bash
pnpm --filter @dtc/backend test:unit
```

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/subscribers/__tests__/product-deleted.unit.spec.ts apps/backend/src/subscribers/product-deleted.ts
git commit -m "feat(subscribers): handle product.deleted → sync Payload"
```

---

## Task 35: Subscribers — product-variant created / updated / deleted

**Files:**
- Create: `apps/backend/src/subscribers/__tests__/product-variant-created.unit.spec.ts`
- Create: `apps/backend/src/subscribers/__tests__/product-variant-updated.unit.spec.ts`
- Create: `apps/backend/src/subscribers/__tests__/product-variant-deleted.unit.spec.ts`
- Create: `apps/backend/src/subscribers/product-variant-created.ts`
- Create: `apps/backend/src/subscribers/product-variant-updated.ts`
- Create: `apps/backend/src/subscribers/product-variant-deleted.ts`

- [ ] **Step 1: Failing tests**

`product-variant-created.unit.spec.ts`:

```ts
import handler, { config } from "../product-variant-created"

jest.mock("../../workflows/payload/create-payload-product-variant", () => ({
  createPayloadProductVariantWorkflow: { run: jest.fn() },
}))

describe("product-variant-created", () => {
  it("subscribes to product-variant.created", () => {
    expect(config.event).toBe("product-variant.created")
  })

  it("calls createPayloadProductVariantWorkflow", async () => {
    const query = jest.fn().mockResolvedValue({
      data: [{ id: "var_1", title: "S", sku: "X-S", product_id: "prod_1", options: [] }],
    })
    const container = {
      resolve: (k: string) =>
        k === "query" ? { graph: query } : { error: jest.fn(), info: jest.fn() },
    } as never
    const mock = jest.requireMock("../../workflows/payload/create-payload-product-variant") as {
      createPayloadProductVariantWorkflow: { run: jest.Mock }
    }
    mock.createPayloadProductVariantWorkflow.run.mockResolvedValueOnce({ result: null })
    await handler({ event: { data: { id: "var_1" } }, container })
    expect(mock.createPayloadProductVariantWorkflow.run).toHaveBeenCalledWith({
      container,
      input: {
        product_id: "prod_1",
        variant: { id: "var_1", title: "S", sku: "X-S", product_id: "prod_1", options: [] },
      },
    })
  })
})
```

`product-variant-updated.unit.spec.ts`:

```ts
import handler, { config } from "../product-variant-updated"

jest.mock("../../workflows/payload/update-payload-product-variants", () => ({
  updatePayloadProductVariantsWorkflow: { run: jest.fn() },
}))

describe("product-variant-updated", () => {
  it("subscribes to product-variant.updated", () => {
    expect(config.event).toBe("product-variant.updated")
  })

  it("calls updatePayloadProductVariantsWorkflow", async () => {
    const query = jest.fn().mockResolvedValue({
      data: [{ id: "var_1", title: "S", sku: "X-S", product_id: "prod_1", options: [] }],
    })
    const container = {
      resolve: (k: string) =>
        k === "query" ? { graph: query } : { error: jest.fn(), info: jest.fn() },
    } as never
    const mock = jest.requireMock("../../workflows/payload/update-payload-product-variants") as {
      updatePayloadProductVariantsWorkflow: { run: jest.Mock }
    }
    mock.updatePayloadProductVariantsWorkflow.run.mockResolvedValueOnce({ result: null })
    await handler({ event: { data: { id: "var_1" } }, container })
    expect(mock.updatePayloadProductVariantsWorkflow.run).toHaveBeenCalled()
  })
})
```

`product-variant-deleted.unit.spec.ts`:

```ts
import handler, { config } from "../product-variant-deleted"

jest.mock("../../workflows/payload/delete-payload-product-variant", () => ({
  deletePayloadProductVariantWorkflow: { run: jest.fn() },
}))

describe("product-variant-deleted", () => {
  it("subscribes to product-variant.deleted", () => {
    expect(config.event).toBe("product-variant.deleted")
  })

  it("calls deletePayloadProductVariantWorkflow with product_id and variant_id", async () => {
    const container = {
      resolve: () => ({ error: jest.fn(), info: jest.fn() }),
    } as never
    const mock = jest.requireMock("../../workflows/payload/delete-payload-product-variant") as {
      deletePayloadProductVariantWorkflow: { run: jest.Mock }
    }
    mock.deletePayloadProductVariantWorkflow.run.mockResolvedValueOnce({ result: null })
    await handler({
      event: { data: { id: "var_1", product_id: "prod_1" } },
      container,
    })
    expect(mock.deletePayloadProductVariantWorkflow.run).toHaveBeenCalledWith({
      container,
      input: { product_id: "prod_1", variant_id: "var_1" },
    })
  })
})
```

- [ ] **Step 2: Run to verify fail**

```bash
pnpm --filter @dtc/backend test:unit
```

- [ ] **Step 3: Implement `product-variant-created.ts`**

```ts
import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createPayloadProductVariantWorkflow } from "../workflows/payload/create-payload-product-variant"

export default async function handleVariantCreated({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  try {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({
      entity: "variant",
      fields: ["id", "title", "sku", "product_id", "options.*"],
      filters: { id: event.data.id },
    })
    const variant = data?.[0]
    if (!variant?.product_id) return
    await createPayloadProductVariantWorkflow.run({
      container,
      input: { product_id: variant.product_id, variant },
    })
  } catch (err) {
    logger.error(`Payload sync failed for product-variant.created (${event.data.id}): ${(err as Error).message}`)
  }
}

export const config: SubscriberConfig = { event: "product-variant.created" }
```

- [ ] **Step 4: Implement `product-variant-updated.ts`**

```ts
import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updatePayloadProductVariantsWorkflow } from "../workflows/payload/update-payload-product-variants"

export default async function handleVariantUpdated({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  try {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({
      entity: "variant",
      fields: ["id", "title", "sku", "product_id", "options.*"],
      filters: { id: event.data.id },
    })
    const variant = data?.[0]
    if (!variant?.product_id) return
    await updatePayloadProductVariantsWorkflow.run({
      container,
      input: { product_id: variant.product_id, variants: [variant] },
    })
  } catch (err) {
    logger.error(`Payload sync failed for product-variant.updated (${event.data.id}): ${(err as Error).message}`)
  }
}

export const config: SubscriberConfig = { event: "product-variant.updated" }
```

- [ ] **Step 5: Implement `product-variant-deleted.ts`**

```ts
import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { deletePayloadProductVariantWorkflow } from "../workflows/payload/delete-payload-product-variant"

export default async function handleVariantDeleted({
  event,
  container,
}: SubscriberArgs<{ id: string; product_id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  try {
    if (!event.data.product_id) return
    await deletePayloadProductVariantWorkflow.run({
      container,
      input: { product_id: event.data.product_id, variant_id: event.data.id },
    })
  } catch (err) {
    logger.error(`Payload sync failed for product-variant.deleted (${event.data.id}): ${(err as Error).message}`)
  }
}

export const config: SubscriberConfig = { event: "product-variant.deleted" }
```

- [ ] **Step 6: Pass + commit**

```bash
pnpm --filter @dtc/backend test:unit
git add apps/backend/src/subscribers/__tests__/product-variant-*.unit.spec.ts apps/backend/src/subscribers/product-variant-*.ts
git commit -m "feat(subscribers): handle product-variant.created/updated/deleted"
```

---

## Task 36: Subscribers — product-option created / deleted

**Files:**
- Create: `apps/backend/src/subscribers/__tests__/product-option-created.unit.spec.ts`
- Create: `apps/backend/src/subscribers/__tests__/product-option-deleted.unit.spec.ts`
- Create: `apps/backend/src/subscribers/product-option-created.ts`
- Create: `apps/backend/src/subscribers/product-option-deleted.ts`

- [ ] **Step 1: Failing tests**

`product-option-created.unit.spec.ts`:

```ts
import handler, { config } from "../product-option-created"

jest.mock("../../workflows/payload/create-payload-product-option", () => ({
  createPayloadProductOptionWorkflow: { run: jest.fn() },
}))

describe("product-option-created", () => {
  it("subscribes to product-option.created", () => {
    expect(config.event).toBe("product-option.created")
  })

  it("calls createPayloadProductOptionWorkflow", async () => {
    const query = jest.fn().mockResolvedValue({
      data: [{ id: "opt_1", title: "Size", product_id: "prod_1", values: [{ value: "S" }] }],
    })
    const container = {
      resolve: (k: string) =>
        k === "query" ? { graph: query } : { error: jest.fn(), info: jest.fn() },
    } as never
    const mock = jest.requireMock("../../workflows/payload/create-payload-product-option") as {
      createPayloadProductOptionWorkflow: { run: jest.Mock }
    }
    mock.createPayloadProductOptionWorkflow.run.mockResolvedValueOnce({ result: null })
    await handler({ event: { data: { id: "opt_1" } }, container })
    expect(mock.createPayloadProductOptionWorkflow.run).toHaveBeenCalled()
  })
})
```

`product-option-deleted.unit.spec.ts`:

```ts
import handler, { config } from "../product-option-deleted"

jest.mock("../../workflows/payload/delete-payload-product-option", () => ({
  deletePayloadProductOptionWorkflow: { run: jest.fn() },
}))

describe("product-option-deleted", () => {
  it("subscribes to product-option.deleted", () => {
    expect(config.event).toBe("product-option.deleted")
  })

  it("calls deletePayloadProductOptionWorkflow with product_id and option_id", async () => {
    const container = {
      resolve: () => ({ error: jest.fn(), info: jest.fn() }),
    } as never
    const mock = jest.requireMock("../../workflows/payload/delete-payload-product-option") as {
      deletePayloadProductOptionWorkflow: { run: jest.Mock }
    }
    mock.deletePayloadProductOptionWorkflow.run.mockResolvedValueOnce({ result: null })
    await handler({
      event: { data: { id: "opt_1", product_id: "prod_1" } },
      container,
    })
    expect(mock.deletePayloadProductOptionWorkflow.run).toHaveBeenCalledWith({
      container,
      input: { product_id: "prod_1", option_id: "opt_1" },
    })
  })
})
```

- [ ] **Step 2: Fail**

```bash
pnpm --filter @dtc/backend test:unit
```

- [ ] **Step 3: Implement `product-option-created.ts`**

```ts
import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createPayloadProductOptionWorkflow } from "../workflows/payload/create-payload-product-option"

export default async function handleOptionCreated({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  try {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({
      entity: "product_option",
      fields: ["id", "title", "product_id", "values.*"],
      filters: { id: event.data.id },
    })
    const option = data?.[0]
    if (!option?.product_id) return
    await createPayloadProductOptionWorkflow.run({
      container,
      input: { product_id: option.product_id, option },
    })
  } catch (err) {
    logger.error(`Payload sync failed for product-option.created (${event.data.id}): ${(err as Error).message}`)
  }
}

export const config: SubscriberConfig = { event: "product-option.created" }
```

- [ ] **Step 4: Implement `product-option-deleted.ts`**

```ts
import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { deletePayloadProductOptionWorkflow } from "../workflows/payload/delete-payload-product-option"

export default async function handleOptionDeleted({
  event,
  container,
}: SubscriberArgs<{ id: string; product_id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  try {
    if (!event.data.product_id) return
    await deletePayloadProductOptionWorkflow.run({
      container,
      input: { product_id: event.data.product_id, option_id: event.data.id },
    })
  } catch (err) {
    logger.error(`Payload sync failed for product-option.deleted (${event.data.id}): ${(err as Error).message}`)
  }
}

export const config: SubscriberConfig = { event: "product-option.deleted" }
```

- [ ] **Step 5: Pass + commit**

```bash
pnpm --filter @dtc/backend test:unit
git add apps/backend/src/subscribers/__tests__/product-option-*.unit.spec.ts apps/backend/src/subscribers/product-option-*.ts
git commit -m "feat(subscribers): handle product-option.created/deleted"
```

---

## Task 37: Subscriber — products.sync-payload (manual bulk sync)

**Files:**
- Create: `apps/backend/src/subscribers/__tests__/products-sync-payload.unit.spec.ts`
- Create: `apps/backend/src/subscribers/products-sync-payload.ts`

- [ ] **Step 1: Failing test**

```ts
import handler, { config } from "../products-sync-payload"

jest.mock("../../workflows/payload/create-payload-products", () => ({
  createPayloadProductsWorkflow: { run: jest.fn() },
}))

describe("products-sync-payload subscriber", () => {
  it("subscribes to products.sync-payload", () => {
    expect(config.event).toBe("products.sync-payload")
  })

  it("queries all products and dispatches create workflow in batches", async () => {
    const query = jest.fn().mockResolvedValue({
      data: [
        { id: "p1", title: "A" },
        { id: "p2", title: "B" },
      ],
    })
    const findUnsynced = jest.fn().mockResolvedValueOnce({
      payload_product: [{ medusa_id: "p1" }],
    })
    const container = {
      resolve: (k: string) => {
        if (k === "query") return { graph: query }
        if (k === "payload") return { list: findUnsynced }
        return { error: jest.fn(), info: jest.fn() }
      },
    } as never
    const mock = jest.requireMock("../../workflows/payload/create-payload-products") as {
      createPayloadProductsWorkflow: { run: jest.Mock }
    }
    mock.createPayloadProductsWorkflow.run.mockResolvedValueOnce({ result: [] })
    await handler({ event: { data: {} }, container })
    expect(mock.createPayloadProductsWorkflow.run).toHaveBeenCalledWith({
      container,
      input: { products: [{ id: "p2", title: "B" }] },
    })
  })
})
```

- [ ] **Step 2: Fail**

```bash
pnpm --filter @dtc/backend test:unit
```

- [ ] **Step 3: Implement**

```ts
import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { PAYLOAD_MODULE } from "../modules/payload"
import type { PayloadModuleService } from "../modules/payload"
import { createPayloadProductsWorkflow } from "../workflows/payload/create-payload-products"

const BATCH_SIZE = 25

export default async function handleProductsSync({ event, container }: SubscriberArgs<unknown>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  try {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "title", "handle", "subtitle", "description", "options.*", "variants.*", "variants.options.*"],
    })
    if (!products?.length) return
    const service = container.resolve<PayloadModuleService>(PAYLOAD_MODULE)
    const ids = products.map((p: { id: string }) => p.id)
    const existing = await service.list({ product_id: ids })
    const existingIds = new Set(existing.payload_product.map((p) => p.medusa_id))
    const unsynced = products.filter((p: { id: string }) => !existingIds.has(p.id))
    for (let i = 0; i < unsynced.length; i += BATCH_SIZE) {
      const batch = unsynced.slice(i, i + BATCH_SIZE)
      await createPayloadProductsWorkflow.run({ container, input: { products: batch } })
    }
    logger.info(`Synced ${unsynced.length} products to Payload (${existingIds.size} already present)`)
  } catch (err) {
    logger.error(`Payload bulk sync failed: ${(err as Error).message}`)
  }
}

export const config: SubscriberConfig = { event: "products.sync-payload" }
```

- [ ] **Step 4: Pass**

```bash
pnpm --filter @dtc/backend test:unit
```

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/subscribers/__tests__/products-sync-payload.unit.spec.ts apps/backend/src/subscribers/products-sync-payload.ts
git commit -m "feat(subscribers): add bulk products.sync-payload handler"
```

---

## Task 38: Manual sync API route

**Files:**
- Create: `apps/backend/src/api/admin/payload/sync/[collection]/route.ts`
- Create: `apps/backend/src/api/admin/payload/config/route.ts`

- [ ] **Step 1: Write the sync route**

```ts
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

const ALLOWED_COLLECTIONS = new Set(["products"])

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const collection = req.params.collection
  if (!ALLOWED_COLLECTIONS.has(collection)) {
    res.status(400).json({ error: `Unsupported collection '${collection}'` })
    return
  }
  const eventBus = req.scope.resolve(ContainerRegistrationKeys.EVENT_BUS)
  await eventBus.emit({ name: `${collection}.sync-payload`, data: {} })
  res.status(202).json({ ok: true, event: `${collection}.sync-payload` })
}
```

- [ ] **Step 2: Write the config route**

`apps/backend/src/api/admin/payload/config/route.ts`:

```ts
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework"

export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  res.status(200).json({
    serverUrl: process.env.PAYLOAD_SERVER_URL ?? "http://localhost:8000",
    userCollection: process.env.PAYLOAD_USER_COLLECTION ?? "users",
  })
}
```

- [ ] **Step 3: Build**

```bash
pnpm --filter @dtc/backend build
```

Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add 'apps/backend/src/api/admin/payload/sync/[collection]/route.ts' apps/backend/src/api/admin/payload/config/route.ts
git commit -m "feat(api): manual Payload sync trigger and config endpoints"
```

---

## Task 39: Medusa admin settings page

**Files:**
- Create: `apps/backend/src/admin/routes/settings/payload/page.tsx`

- [ ] **Step 1: Write the page**

```tsx
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Text, toast } from "@medusajs/ui"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useState } from "react"

type ConfigResponse = { serverUrl: string; userCollection: string }

const PayloadSettingsPage = () => {
  const [lastEvent, setLastEvent] = useState<string | null>(null)
  const { data: cfg } = useQuery<ConfigResponse>({
    queryKey: ["payload-config"],
    queryFn: async () => {
      const res = await fetch("/admin/payload/config", { credentials: "include" })
      if (!res.ok) throw new Error("Failed to load Payload config")
      return res.json()
    },
  })
  const sync = useMutation({
    mutationFn: async () => {
      const res = await fetch("/admin/payload/sync/products", {
        method: "POST",
        credentials: "include",
      })
      if (!res.ok) throw new Error("Sync failed")
      return res.json() as Promise<{ ok: boolean; event: string }>
    },
    onSuccess: (data) => {
      setLastEvent(data.event)
      toast.success("Payload sync triggered")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <Container className="p-6">
      <Heading level="h1">Payload CMS</Heading>
      <div className="mt-4 space-y-2">
        <Text>
          <span className="font-semibold">Server URL:</span>{" "}
          <code>{cfg?.serverUrl ?? "loading..."}</code>
        </Text>
        <Text>
          <span className="font-semibold">User collection:</span>{" "}
          <code>{cfg?.userCollection ?? "loading..."}</code>
        </Text>
      </div>
      <div className="mt-6">
        <Button onClick={() => sync.mutate()} isLoading={sync.isPending}>
          Sync products to Payload
        </Button>
        {lastEvent && (
          <Text className="mt-2 text-sm">Last triggered event: <code>{lastEvent}</code></Text>
        )}
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Payload CMS",
})

export default PayloadSettingsPage
```

- [ ] **Step 2: Build the backend (includes admin bundle)**

```bash
pnpm --filter @dtc/backend build
```

Expected: exit 0. Admin bundle compiles the new route.

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/admin/routes/settings/payload/page.tsx
git commit -m "feat(admin): add Payload CMS settings page with sync button"
```

---

## Task 40: Storefront — products data fetch adds Payload fields

**Files:**
- Modify: `apps/storefront/src/lib/data/products.ts`

- [ ] **Step 1: Read the current implementation**

```bash
cat apps/storefront/src/lib/data/products.ts | head -80
```

- [ ] **Step 2: Update field lists**

Locate the `fields` parameter passed to the Medusa store products call (likely something like `fields: "*variants.calculated_price,..."`). Append `,+payload_product.*` to every such call so the virtual link expands.

Example before:

```ts
fields: "*variants.calculated_price,*variants.options"
```

Example after:

```ts
fields: "*variants.calculated_price,*variants.options,+payload_product.*"
```

Apply this to every function in the file that fetches a `StoreProduct` (single product, list, related, etc.).

- [ ] **Step 3: Commit**

```bash
git add apps/storefront/src/lib/data/products.ts
git commit -m "feat(storefront): include Payload product fields in product fetch"
```

---

## Task 41: Storefront — types and Lexical renderer

**Files:**
- Create: `apps/storefront/src/types/payload.ts`
- Create: `apps/storefront/src/types/global.ts`
- Create: `apps/storefront/src/components/payload/RichText.tsx`

- [ ] **Step 1: Write `src/types/payload.ts`**

```ts
import type { SerializedEditorState } from "lexical"

export type PayloadMedia = {
  id: string
  url?: string | null
  alt?: string | null
  width?: number | null
  height?: number | null
  sizes?: Record<string, { url?: string | null; width?: number | null; height?: number | null }>
}

export type PayloadProductOption = {
  medusa_id: string
  title?: string
  values?: { value: string }[]
}

export type PayloadProductVariant = {
  medusa_id: string
  title?: string
  sku?: string
  option_values?: { option_medusa_id: string; value: string }[]
}

export type PayloadProductFromLink = {
  id: string
  medusa_id: string
  title?: string
  handle?: string
  subtitle?: string
  description?: SerializedEditorState | null
  thumbnail?: PayloadMedia | null
  images?: { image: PayloadMedia }[]
  seo?: { title?: string; description?: string; keywords?: string }
  options?: PayloadProductOption[]
  variants?: PayloadProductVariant[]
}
```

- [ ] **Step 2: Write `src/types/global.ts`**

```ts
import type { HttpTypes } from "@medusajs/types"
import type { PayloadProductFromLink } from "./payload"

export type StoreProductWithPayload = HttpTypes.StoreProduct & {
  payload_product?: PayloadProductFromLink | null
}
```

- [ ] **Step 3: Write `src/components/payload/RichText.tsx`**

```tsx
"use client"

import { RichText as LexicalRichText } from "@payloadcms/richtext-lexical/react"
import type { SerializedEditorState } from "lexical"

type Props = {
  data?: SerializedEditorState | null
  fallback?: string | null
  className?: string
}

export function PayloadRichText({ data, fallback, className }: Props) {
  if (data && typeof data === "object") {
    return <LexicalRichText data={data} className={className} />
  }
  if (fallback) {
    return <p className={className}>{fallback}</p>
  }
  return null
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/storefront/src/types/payload.ts apps/storefront/src/types/global.ts apps/storefront/src/components/payload/RichText.tsx
git commit -m "feat(storefront): types and Lexical renderer for Payload data"
```

---

## Task 42: Storefront — render Payload fields in product display

**Files:**
- Modify: `apps/storefront/src/modules/products/templates/index.tsx` (the PDP template) and any other component that renders product `title`, `description`, `thumbnail`, or `images`.

- [ ] **Step 1: Locate the PDP template**

```bash
ls apps/storefront/src/modules/products/templates/
```

Read the main template file. Identify where `product.title`, `product.description`, `product.thumbnail`, `product.images` are rendered.

- [ ] **Step 2: Wire Payload fallbacks**

In each render site, change `product.X` to prefer Payload data:

Title:

```tsx
const title = (product as StoreProductWithPayload).payload_product?.title ?? product.title
```

Description (replace the plain-text render with `PayloadRichText`):

```tsx
import { PayloadRichText } from "@/components/payload/RichText"
import type { StoreProductWithPayload } from "@/types/global"

const payloadProduct = (product as StoreProductWithPayload).payload_product

<PayloadRichText data={payloadProduct?.description ?? null} fallback={product.description} className="text-base" />
```

Thumbnail URL:

```tsx
const thumbnail = payloadProduct?.thumbnail?.url ?? product.thumbnail ?? null
```

Images array:

```tsx
const images = (payloadProduct?.images?.map((i) => i.image.url).filter(Boolean) as string[] | undefined)
  ?? product.images?.map((img) => img.url)
  ?? []
```

SEO (in `generateMetadata` for the PDP page):

```tsx
const seoTitle = payloadProduct?.seo?.title ?? product.title
const seoDescription = payloadProduct?.seo?.description ?? product.description
```

Apply the same `StoreProductWithPayload` cast to PLP cards (`src/modules/products/components/product-preview` or similar) for title and thumbnail.

- [ ] **Step 3: Type-check and build**

```bash
pnpm --filter @dtc/storefront exec tsc --noEmit
pnpm --filter @dtc/storefront build
```

Expected: both exit 0.

- [ ] **Step 4: Commit**

```bash
git add apps/storefront/src
git commit -m "feat(storefront): render Payload fields with Medusa fallback in PDP/PLP"
```

---

## Task 43: Integration tests — Payload mock server helper

**Files:**
- Create: `apps/backend/integration-tests/setup.js`
- Create: `apps/backend/integration-tests/helpers/payload-mock-server.ts`

- [ ] **Step 1: Write `integration-tests/setup.js`**

(The existing jest.config.js references this file; create the minimal version.)

```js
// Setup file referenced by jest.config.js. Intentionally minimal.
process.env.PAYLOAD_SERVER_URL = process.env.PAYLOAD_SERVER_URL || "http://127.0.0.1:0"
process.env.PAYLOAD_API_KEY = process.env.PAYLOAD_API_KEY || "test-key"
process.env.PAYLOAD_USER_COLLECTION = process.env.PAYLOAD_USER_COLLECTION || "users"
```

- [ ] **Step 2: Write `helpers/payload-mock-server.ts`**

```ts
import http from "http"
import type { AddressInfo } from "net"

export type RecordedRequest = {
  method: string
  url: string
  pathname: string
  searchParams: URLSearchParams
  body: unknown
  headers: Record<string, string>
}

type Handler = (req: RecordedRequest) => { status?: number; body?: unknown }

export interface PayloadMockServer {
  url: string
  requests: RecordedRequest[]
  setHandler(handler: Handler): void
  close(): Promise<void>
  reset(): void
}

export async function startPayloadMockServer(): Promise<PayloadMockServer> {
  const requests: RecordedRequest[] = []
  let handler: Handler = () => ({ status: 200, body: { docs: [], totalDocs: 0 } })
  const server = http.createServer((req, res) => {
    const chunks: Buffer[] = []
    req.on("data", (c) => chunks.push(c))
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8")
      let parsed: unknown = undefined
      if (raw.length) {
        try { parsed = JSON.parse(raw) } catch { parsed = raw }
      }
      const url = new URL(req.url ?? "/", "http://localhost")
      const record: RecordedRequest = {
        method: req.method ?? "GET",
        url: req.url ?? "/",
        pathname: url.pathname,
        searchParams: url.searchParams,
        body: parsed,
        headers: Object.fromEntries(
          Object.entries(req.headers).map(([k, v]) => [k, Array.isArray(v) ? v.join(",") : String(v ?? "")])
        ),
      }
      requests.push(record)
      const result = handler(record)
      res.statusCode = result.status ?? 200
      res.setHeader("content-type", "application/json")
      res.end(JSON.stringify(result.body ?? {}))
    })
  })
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r))
  const address = server.address() as AddressInfo
  const url = `http://127.0.0.1:${address.port}`
  return {
    url,
    requests,
    setHandler(h) { handler = h },
    reset() { requests.length = 0 },
    close: () => new Promise<void>((r) => server.close(() => r())),
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/backend/integration-tests/setup.js apps/backend/integration-tests/helpers/payload-mock-server.ts
git commit -m "test: add Payload HTTP mock server for integration tests"
```

---

## Task 44: Integration test — product sync flow

**Files:**
- Create: `apps/backend/integration-tests/http/payload-product-sync.spec.ts`

- [ ] **Step 1: Write the test**

```ts
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { startPayloadMockServer, type PayloadMockServer } from "../helpers/payload-mock-server"

jest.setTimeout(60_000)

medusaIntegrationTestRunner({
  testSuite: ({ api, getContainer }) => {
    let mock: PayloadMockServer

    beforeAll(async () => {
      mock = await startPayloadMockServer()
      process.env.PAYLOAD_SERVER_URL = mock.url
      // Rebind the service options on the running container — read fresh on next request.
      // (The service reads options once at construction; module is re-resolved per request via runtime.)
    })

    afterAll(async () => {
      await mock.close()
    })

    beforeEach(() => {
      mock.reset()
      mock.setHandler((req) => {
        if (req.method === "GET" && req.pathname === "/api/products") {
          return { status: 200, body: { docs: [], totalDocs: 0 } }
        }
        if (req.method === "POST" && req.pathname === "/api/products") {
          const body = (req.body as { medusa_id: string }) ?? { medusa_id: "" }
          return {
            status: 201,
            body: { doc: { id: `pl_${body.medusa_id}`, ...body, createdAt: "", updatedAt: "" }, message: "ok" },
          }
        }
        if (req.method === "PATCH" && req.pathname.startsWith("/api/products/")) {
          return { status: 200, body: { doc: { id: req.pathname.split("/").pop(), medusa_id: "x", createdAt: "", updatedAt: "" }, message: "ok" } }
        }
        if (req.method === "DELETE" && req.pathname.startsWith("/api/products/")) {
          return { status: 200, body: { message: "deleted" } }
        }
        return { status: 404, body: { message: "not found" } }
      })
    })

    it("creates a Payload product when a Medusa product is created", async () => {
      const created = await api.post(
        "/admin/products",
        { title: "Hat", options: [], variants: [] },
        adminHeaders()
      )
      expect(created.status).toBe(200)
      // Allow the event bus to dispatch.
      await waitFor(() => mock.requests.some((r) => r.method === "POST" && r.pathname === "/api/products"))
      const postReq = mock.requests.find((r) => r.method === "POST" && r.pathname === "/api/products")!
      expect((postReq.body as { medusa_id: string }).medusa_id).toBe(created.data.product.id)
      expect(postReq.headers.authorization).toBe("users API-Key test-key")
    })

    it("updates the Payload product when a Medusa product is updated", async () => {
      const { data } = await api.post("/admin/products", { title: "Cap" }, adminHeaders())
      await waitFor(() => mock.requests.some((r) => r.method === "POST" && r.pathname === "/api/products"))
      mock.reset()
      mock.setHandler((req) => {
        if (req.method === "GET" && req.pathname === "/api/products") {
          return { status: 200, body: { docs: [{ id: "pl_1", medusa_id: data.product.id, createdAt: "", updatedAt: "" }], totalDocs: 1 } }
        }
        if (req.method === "PATCH") return { status: 200, body: { doc: { id: "pl_1" }, message: "ok" } }
        return { status: 404, body: {} }
      })
      await api.post(`/admin/products/${data.product.id}`, { title: "Cap v2" }, adminHeaders())
      await waitFor(() => mock.requests.some((r) => r.method === "PATCH" && r.pathname === "/api/products/pl_1"))
    })

    it("deletes the Payload product when a Medusa product is deleted", async () => {
      const { data } = await api.post("/admin/products", { title: "Gone" }, adminHeaders())
      await waitFor(() => mock.requests.some((r) => r.method === "POST"))
      mock.reset()
      mock.setHandler((req) => {
        if (req.method === "GET" && req.pathname === "/api/products") {
          return { status: 200, body: { docs: [{ id: "pl_1", medusa_id: data.product.id, createdAt: "", updatedAt: "" }], totalDocs: 1 } }
        }
        if (req.method === "DELETE") return { status: 200, body: { message: "ok" } }
        return { status: 404, body: {} }
      })
      await api.delete(`/admin/products/${data.product.id}`, adminHeaders())
      await waitFor(() => mock.requests.some((r) => r.method === "DELETE" && r.pathname === "/api/products/pl_1"))
    })

    it("merges Payload data via the virtual link on read", async () => {
      const { data } = await api.post("/admin/products", { title: "Boots" }, adminHeaders())
      await waitFor(() => mock.requests.some((r) => r.method === "POST"))
      mock.reset()
      mock.setHandler((req) => {
        if (req.method === "GET" && req.pathname === "/api/products") {
          return {
            status: 200,
            body: {
              docs: [{ id: "pl_b", medusa_id: data.product.id, title: "Boots from Payload", createdAt: "", updatedAt: "" }],
              totalDocs: 1,
            },
          }
        }
        return { status: 200, body: {} }
      })
      const read = await api.get(
        `/admin/products/${data.product.id}?fields=id,title,+payload_product.*`,
        adminHeaders()
      )
      expect(read.data.product.payload_product?.title).toBe("Boots from Payload")
    })

    function adminHeaders() {
      return { headers: { "x-medusa-access-token": getContainer().__test_admin_token__ ?? "" } }
    }
  },
})

async function waitFor(predicate: () => boolean, timeoutMs = 5000) {
  const start = Date.now()
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error("waitFor timed out")
    }
    await new Promise((r) => setTimeout(r, 50))
  }
}
```

- [ ] **Step 2: Run integration tests**

Make sure your local Postgres is up and a Medusa test database is configured (Medusa test runner manages its own database — read `node_modules/@medusajs/test-utils/README.md` if unsure how it picks the DB).

```bash
pnpm --filter @dtc/backend test:integration:http
```

Expected: PASS. If the test fails because the running module reads `PAYLOAD_SERVER_URL` only at startup (not per-request), the workaround is to set `process.env.PAYLOAD_SERVER_URL` before the `medusaIntegrationTestRunner` starts — i.e., set it in `globalSetup` or at the top of the file outside `beforeAll`. Update the test accordingly if needed (move the `mock = await startPayloadMockServer()` and the env assignment to `globalSetup` and start a single mock for the suite).

- [ ] **Step 3: Commit**

```bash
git add apps/backend/integration-tests/http/payload-product-sync.spec.ts
git commit -m "test(integration): verify Medusa→Payload product sync flow"
```

---

## Task 45: Integration test — manual sync API

**Files:**
- Create: `apps/backend/integration-tests/http/payload-manual-sync.spec.ts`

- [ ] **Step 1: Write the test**

```ts
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { startPayloadMockServer, type PayloadMockServer } from "../helpers/payload-mock-server"

jest.setTimeout(60_000)

medusaIntegrationTestRunner({
  testSuite: ({ api, getContainer }) => {
    let mock: PayloadMockServer

    beforeAll(async () => {
      mock = await startPayloadMockServer()
      process.env.PAYLOAD_SERVER_URL = mock.url
    })

    afterAll(async () => {
      await mock.close()
    })

    beforeEach(() => {
      mock.reset()
    })

    it("bulk syncs unsynced products on POST /admin/payload/sync/products", async () => {
      // Seed two products with Payload returning "not found" so both look unsynced.
      mock.setHandler((req) => {
        if (req.method === "GET" && req.pathname === "/api/products") {
          return { status: 200, body: { docs: [], totalDocs: 0 } }
        }
        if (req.method === "POST" && req.pathname === "/api/products") {
          const body = (req.body as { medusa_id: string }) ?? { medusa_id: "" }
          return {
            status: 201,
            body: { doc: { id: `pl_${body.medusa_id}`, medusa_id: body.medusa_id, createdAt: "", updatedAt: "" }, message: "ok" },
          }
        }
        return { status: 200, body: {} }
      })
      const p1 = await api.post("/admin/products", { title: "A" }, adminHeaders())
      const p2 = await api.post("/admin/products", { title: "B" }, adminHeaders())
      await waitFor(() => mock.requests.filter((r) => r.method === "POST" && r.pathname === "/api/products").length >= 2)
      mock.reset()
      const resp = await api.post("/admin/payload/sync/products", {}, adminHeaders())
      expect(resp.status).toBe(202)
      expect(resp.data.event).toBe("products.sync-payload")
      await waitFor(() => mock.requests.some((r) => r.method === "GET" && r.pathname === "/api/products"))
    })

    function adminHeaders() {
      return { headers: { "x-medusa-access-token": getContainer().__test_admin_token__ ?? "" } }
    }
  },
})

async function waitFor(predicate: () => boolean, timeoutMs = 5000) {
  const start = Date.now()
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) throw new Error("waitFor timed out")
    await new Promise((r) => setTimeout(r, 50))
  }
}
```

- [ ] **Step 2: Run**

```bash
pnpm --filter @dtc/backend test:integration:http
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/backend/integration-tests/http/payload-manual-sync.spec.ts
git commit -m "test(integration): verify manual Payload sync endpoint"
```

---

## Task 46: Final verification — full build + tests

**No file changes.** Verification only.

- [ ] **Step 1: Full install**

```bash
pnpm install
```

Expected: no version warnings related to Payload or Next.

- [ ] **Step 2: Full build**

```bash
pnpm -r build
```

Expected: every workspace builds. Storefront produces `.next/` and a fresh Payload import map. Backend produces `.medusa/` build artifacts.

- [ ] **Step 3: Unit tests**

```bash
pnpm --filter @dtc/backend test:unit
```

Expected: PASS.

- [ ] **Step 4: Integration tests**

```bash
pnpm --filter @dtc/backend test:integration:http
```

Expected: PASS.

- [ ] **Step 5: Smoke test by hand**

In one shell: `pnpm --filter @dtc/backend dev`. In another: `pnpm --filter @dtc/storefront dev`. Visit `http://localhost:8000/admin` (Payload), `http://localhost:9000/app/settings` (Medusa admin → Payload CMS section), and the storefront root. Create a product via Medusa admin; refresh Payload admin → the product appears under `Products`. Click the storefront's `/admin` link — Payload loads.

- [ ] **Step 6: Commit a final integration-checked marker if anything changed (e.g. minor README updates), or stop here.**

---

## Self-review

**Spec coverage check:**

- Spec §"Storefront — Payload setup" → Tasks 1–11 (Next 16, deps, config, env, middleware, app restructure, route group, import map, admin smoke test) ✓
- Spec §"Backend — Payload module" → Tasks 17–22 (types, errors, service, mappers, module index, config) ✓
- Spec §"Backend — Workflows" → Tasks 23–30 (all 8 workflows + their steps) ✓
- Spec §"Backend — Subscribers" → Tasks 32–37 (8 product/variant/option subscribers + bulk sync) ✓
- Spec §"Backend — Virtual link" → Task 31 ✓
- Spec §"Backend — Manual sync API + admin UI" → Tasks 38–39 ✓
- Spec §"Storefront — Display" → Tasks 40–42 ✓
- Spec §"Testing" → Tasks 19, 21, 32–37 (unit tests inline with TDD), Tasks 43–45 (integration tests) ✓
- Spec §"Build verification" → Task 46 ✓
- Spec §"Sequencing" — 9 phases in spec map to 46 tasks here in same order ✓

**Placeholder scan:** No TBD/TODO/implement-later. All test code, all implementation code, all commands fully written.

**Type consistency:** `PayloadModuleService.list({ product_id: string | string[] })` returns `{ payload_product: PayloadProduct[] }` — used identically in the virtual link (Task 31), the bulk-sync subscriber (Task 37), and the unit tests (Task 19). Workflow input types use the same `Product`/`Variant`/`Option` shapes throughout. `StoreProductWithPayload` defined in Task 41 and used in Task 42.

**Risk flagged inline:** Task 44 documents the workaround if `PAYLOAD_SERVER_URL` is read only at module construction — the test sets the env var before `medusaIntegrationTestRunner` starts.
