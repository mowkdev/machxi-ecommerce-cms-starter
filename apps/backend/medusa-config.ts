import { loadEnv, defineConfig } from "@medusajs/framework/utils"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

const s3Bucket = process.env.S3_BUCKET

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
  // Translation module is gated behind the `translation` feature flag.
  // Translates Product, ProductCategory, ProductCollection, ProductVariant,
  // Region, ShippingOption, etc. Storefront sends locale via the
  // `x-medusa-locale` header (BCP47 like `en-US`, `lv-LV`) — see
  // apps/storefront/src/lib/medusa.ts.
  featureFlags: {
    translation: true,
  },
  modules: [
    { resolve: "@medusajs/medusa/translation" },
    {
      resolve: "./src/modules/payload",
      options: {
        serverUrl: process.env.PAYLOAD_SERVER_URL || "http://localhost:8000",
        apiKey: process.env.PAYLOAD_API_KEY || "",
        userCollection: process.env.PAYLOAD_USER_COLLECTION || "users",
      },
    },
    ...(s3Bucket
      ? [
          {
            resolve: "@medusajs/medusa/file",
            options: {
              providers: [
                {
                  resolve: "@medusajs/medusa/file-s3",
                  id: "s3",
                  options: {
                    file_url: process.env.S3_FILE_URL,
                    access_key_id: process.env.S3_ACCESS_KEY_ID,
                    secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
                    region: process.env.S3_REGION,
                    bucket: s3Bucket,
                    endpoint: process.env.S3_ENDPOINT,
                    // MinIO / Supabase / other S3-compatible servers require
                    // path-style addressing.
                    // https://docs.medusajs.com/resources/infrastructure-modules/file/s3
                    additional_client_config: {
                      forcePathStyle: true,
                    },
                  },
                },
              ],
            },
          },
        ]
      : []),
  ],
})
