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
  editor: defaultLexical,
  secret: payloadSecret,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: postgresAdapter({
    pool: {
      connectionString: payloadDatabaseUrl,
    },
    // Dev only: auto-apply collection schema changes (drop/rename columns,
    // remove array sub-tables, etc.). Production should use generated
    // migrations via `payload migrate:create` + `payload migrate`.
    push: process.env.NODE_ENV !== "production",
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
