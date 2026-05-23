import path from "path"
import { fileURLToPath } from "url"
import sharp from "sharp"
import { postgresAdapter } from "@payloadcms/db-postgres"
import { mcpPlugin } from "@payloadcms/plugin-mcp"
import { s3Storage } from "@payloadcms/storage-s3"
import { buildConfig } from "payload"

import { defaultLexical } from "./fields/defaultLexical"
import { plugins } from "./plugins"
import { Users } from "./collections/Users"
import { Media } from "./collections/Media"
import { Pages } from "./collections/Pages"
import { Products } from "./collections/Products"
import { MedusaIntegration } from "./globals/MedusaIntegration"
import { DEFAULT_LOCALE, LOCALES } from "./i18n/localization"

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const payloadSecret = process.env.PAYLOAD_SECRET
if (!payloadSecret) {
  throw new Error("PAYLOAD_SECRET env var is required")
}

const payloadDatabaseUrl = process.env.PAYLOAD_DATABASE_URL
if (!payloadDatabaseUrl) {
  throw new Error("PAYLOAD_DATABASE_URL env var is required")
}

export default buildConfig({
  admin: {
    user: Users.slug,
    livePreview: {
      breakpoints: [
        { label: "Mobile", name: "mobile", width: 375, height: 667 },
        { label: "Tablet", name: "tablet", width: 768, height: 1024 },
        { label: "Desktop", name: "desktop", width: 1440, height: 900 },
      ],
    },
  },
  collections: [Users, Media, Pages, Products],
  globals: [MedusaIntegration],
  // Same locale codes the storefront URL segment and next-intl use. Medusa
  // accepts BCP47 (en-US, lv-LV) — that mapping lives in
  // src/i18n/localization.ts and is applied at the Medusa SDK boundary.
  localization: {
    locales: LOCALES.map((l) => ({ code: l.code, label: l.label })),
    defaultLocale: DEFAULT_LOCALE,
    fallback: true,
  },
  editor: defaultLexical,
  secret: payloadSecret,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: postgresAdapter({
    pool: {
      connectionString: payloadDatabaseUrl,
    },
    // Auto-apply collection schema changes (drop/rename columns, remove array
    // sub-tables, etc.). Defaults to ON in non-production for fast dev
    // iteration. PAYLOAD_PUSH=true lets you opt in even when NODE_ENV=production
    // — useful for local prod-parity testing before you've generated migrations.
    push:
      process.env.PAYLOAD_PUSH === "true" ||
      process.env.NODE_ENV !== "production",
  }),
  plugins: [
    ...plugins,
    mcpPlugin({
      collections: {
        products: {
          description: "Payload-side product enrichment mirrored from Medusa.",
          enabled: { find: true, update: true, create: false, delete: false },
        },
        media: {
          description: "Storefront media library (images, alt text).",
          enabled: { find: true },
        },
        pages: {
          description: "CMS pages — hero + layout blocks. Slug 'home' powers /.",
          enabled: { find: true, update: true, create: true, delete: false },
        },
        users: {
          description: "Admin users (read-only via MCP).",
          enabled: { find: true },
        },
      },
    }),
    // Off when S3_BUCKET is unset — falls back to Media collection's
    // local staticDir so devs can run Payload without MinIO.
    // https://payloadcms.com/docs/upload/storage-adapters
    s3Storage({
      enabled: Boolean(process.env.S3_BUCKET),
      collections: {
        [Media.slug]: true,
      },
      bucket: process.env.S3_BUCKET ?? "",
      config: {
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
        },
        region: process.env.S3_REGION,
        endpoint: process.env.S3_ENDPOINT,
        // MinIO requires path-style addressing.
        forcePathStyle: true,
      },
    }),
  ],
  sharp,
})
