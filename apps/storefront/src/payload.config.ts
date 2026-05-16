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

const payloadSecret = process.env.PAYLOAD_SECRET
if (!payloadSecret) {
  throw new Error("PAYLOAD_SECRET env var is required")
}

const payloadDatabaseUrl = process.env.PAYLOAD_DATABASE_URL
if (!payloadDatabaseUrl) {
  throw new Error("PAYLOAD_DATABASE_URL env var is required")
}

export default buildConfig({
  admin: { user: Users.slug },
  collections: [Users, Media, Products],
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
