import path from "path"
import { fileURLToPath } from "url"
import sharp from "sharp"
import { lexicalEditor } from "@payloadcms/richtext-lexical"
import { postgresAdapter } from "@payloadcms/db-postgres"
import { buildConfig } from "payload"

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
  collections: [],
  editor: lexicalEditor(),
  secret: payloadSecret,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: postgresAdapter({
    pool: {
      connectionString: payloadDatabaseUrl,
    },
  }),
  sharp,
})
