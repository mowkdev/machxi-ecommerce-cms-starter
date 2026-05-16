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
