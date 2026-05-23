import type { MedusaRequest, MedusaResponse } from "@medusajs/framework"

import { PAYLOAD_MODULE } from "../../../../modules/payload"
import type PayloadModuleService from "../../../../modules/payload/service"

type IntegrationRow = {
  id: string
  api_key: string
  user_collection: string | null
}

type IntegrationService = PayloadModuleService & {
  listPayloadIntegrationSettings: () => Promise<IntegrationRow[]>
  createPayloadIntegrationSettings: (
    data: { api_key: string; user_collection: string }
  ) => Promise<IntegrationRow>
  updatePayloadIntegrationSettings: (
    data: { id: string; api_key?: string; user_collection?: string }
  ) => Promise<IntegrationRow>
  clearSettingsCache: () => void
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(PAYLOAD_MODULE) as IntegrationService
  const rows = await service.listPayloadIntegrationSettings()
  const row = rows[0]
  res.status(200).json({
    hasApiKey: Boolean(row?.api_key),
    userCollection: row?.user_collection ?? "users",
  })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body ?? {}) as { apiKey?: string; userCollection?: string }
  const apiKey = (body.apiKey ?? "").trim()
  if (!apiKey) {
    res.status(400).json({ message: "apiKey is required" })
    return
  }
  const userCollection = (body.userCollection ?? "users").trim() || "users"

  const service = req.scope.resolve(PAYLOAD_MODULE) as IntegrationService
  const existing = await service.listPayloadIntegrationSettings()
  if (existing[0]) {
    await service.updatePayloadIntegrationSettings({
      id: existing[0].id,
      api_key: apiKey,
      user_collection: userCollection,
    })
  } else {
    await service.createPayloadIntegrationSettings({
      api_key: apiKey,
      user_collection: userCollection,
    })
  }
  service.clearSettingsCache()
  res.status(200).json({ hasApiKey: true, userCollection })
}
