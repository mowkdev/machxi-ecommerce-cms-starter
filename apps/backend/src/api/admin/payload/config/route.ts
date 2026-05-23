import type { MedusaRequest, MedusaResponse } from "@medusajs/framework"

import { PAYLOAD_MODULE } from "../../../../modules/payload"
import type PayloadModuleService from "../../../../modules/payload/service"

/**
 * Returns the resolved Payload connection config used by the module service.
 * `userCollection` is now sourced from the integration_settings DB row, not
 * env — fall back to "users" when no row exists yet (fresh install).
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const payloadService = req.scope.resolve(PAYLOAD_MODULE) as PayloadModuleService
  let userCollection = "users"
  let hasApiKey = false
  try {
    const rows = await payloadService.listPayloadIntegrationSettings()
    const row = rows[0]
    if (row) {
      userCollection = row.user_collection || "users"
      hasApiKey = Boolean(row.api_key)
    }
  } catch {
    // Table not yet migrated (very first boot) — keep defaults.
  }

  res.status(200).json({
    serverUrl: process.env.PAYLOAD_SERVER_URL ?? "http://localhost:8000",
    userCollection,
    hasApiKey,
  })
}
