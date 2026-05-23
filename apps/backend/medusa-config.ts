import { loadEnv, defineConfig } from "@medusajs/framework/utils"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

const s3Bucket = process.env.S3_BUCKET
const redisUrl = process.env.REDIS_URL

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    // Single-container deploy. Set MEDUSA_WORKER_MODE=worker to run a
    // dedicated worker process; scheduled jobs only run in shared or worker
    // mode (NOT server-only).
    workerMode: (process.env.MEDUSA_WORKER_MODE as "shared" | "server" | "worker") || "shared",
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
        // apiKey and userCollection now live in the payload_integration_settings
        // table — set them via Medusa Admin → Settings → Payload Integration.
      },
    },
    // Redis-backed cache / event bus / workflow engine / locking. Gated on
    // REDIS_URL so local dev still works without Redis (Medusa falls back to
    // in-memory). Production should always set REDIS_URL.
    ...(redisUrl
      ? [
          {
            resolve: "@medusajs/medusa/cache-redis",
            options: { redisUrl },
          },
          { resolve: "@medusajs/medusa/event-bus-redis", options: { redisUrl } },
          {
            resolve: "@medusajs/medusa/workflow-engine-redis",
            options: { redis: { url: redisUrl } },
          },
          {
            resolve: "@medusajs/medusa/locking",
            options: {
              providers: [
                {
                  resolve: "@medusajs/medusa/locking-redis",
                  id: "locking-redis",
                  is_default: true,
                  options: { redisUrl },
                },
              ],
            },
          },
        ]
      : []),
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
