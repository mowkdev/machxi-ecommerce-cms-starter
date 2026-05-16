import type { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

const ALLOWED_COLLECTIONS = new Set(["products"])

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const collection = req.params.collection
  if (!ALLOWED_COLLECTIONS.has(collection)) {
    res.status(400).json({ error: `Unsupported collection '${collection}'` })
    return
  }
  const eventBus = req.scope.resolve(Modules.EVENT_BUS)
  await eventBus.emit({ name: `${collection}.sync-payload`, data: {} })
  res.status(202).json({ ok: true, event: `${collection}.sync-payload` })
}
