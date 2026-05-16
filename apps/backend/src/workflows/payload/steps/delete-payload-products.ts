import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PAYLOAD_MODULE } from "../../../modules/payload"
import type { PayloadModuleService } from "../../../modules/payload"

type Input = { ids: string[] }

export const deletePayloadProductsStep = createStep(
  "delete-payload-products",
  async (input: Input, { container }) => {
    const service = container.resolve<PayloadModuleService>(PAYLOAD_MODULE)
    const deleted: Array<{ medusa_id: string; payload_id: string }> = []
    for (const medusaId of input.ids) {
      const found = await service.find("products", {
        where: { medusa_id: { equals: medusaId } },
        limit: 1,
      })
      const doc = found.docs[0]
      if (!doc) continue
      await service.delete("products", doc.id)
      deleted.push({ medusa_id: medusaId, payload_id: doc.id })
    }
    return new StepResponse(deleted)
    // No clean compensation possible without snapshotting full content.
  }
)
