import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PAYLOAD_MODULE, mapMedusaProductToPayload } from "../../../modules/payload"
import type { PayloadModuleService } from "../../../modules/payload"

type Product = Parameters<typeof mapMedusaProductToPayload>[0]

type Input = { products: Product[] }

export const createPayloadProductsStep = createStep(
  "create-payload-products",
  async (input: Input, { container }) => {
    const service = container.resolve<PayloadModuleService>(PAYLOAD_MODULE)
    const created: Array<{ payload_id: string; medusa_id: string }> = []
    for (const product of input.products) {
      const existing = await service.find("products", {
        where: { medusa_id: { equals: product.id } },
        limit: 1,
      })
      if (existing.docs[0]) {
        created.push({ payload_id: existing.docs[0].id, medusa_id: product.id })
        continue
      }
      const result = await service.create("products", mapMedusaProductToPayload(product))
      created.push({ payload_id: result.doc.id, medusa_id: product.id })
    }
    return new StepResponse(created, created)
  },
  async (created, { container }) => {
    if (!created?.length) return
    const service = container.resolve<PayloadModuleService>(PAYLOAD_MODULE)
    for (const c of created) {
      try {
        await service.delete("products", c.payload_id)
      } catch {
        // best-effort compensation
      }
    }
  }
)
