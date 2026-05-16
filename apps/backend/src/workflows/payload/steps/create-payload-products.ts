import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PAYLOAD_MODULE, mapMedusaProductToPayload } from "../../../modules/payload"
import type { PayloadModuleService } from "../../../modules/payload"

type Product = Parameters<typeof mapMedusaProductToPayload>[0]

type Input = { products: Product[] }

export const createPayloadProductsStep = createStep(
  "create-payload-products",
  async (input: Input, { container }) => {
    const service = container.resolve<PayloadModuleService>(PAYLOAD_MODULE)
    const result: Array<{ payload_id: string; medusa_id: string }> = []
    const createdInThisStep: Array<{ payload_id: string; medusa_id: string }> = []
    for (const product of input.products) {
      const existing = await service.find("products", {
        where: { medusa_id: { equals: product.id } },
        limit: 1,
      })
      if (existing.docs[0]) {
        result.push({ payload_id: existing.docs[0].id, medusa_id: product.id })
        continue
      }
      const created = await service.create("products", mapMedusaProductToPayload(product))
      const record = { payload_id: created.doc.id, medusa_id: product.id }
      result.push(record)
      createdInThisStep.push(record)
    }
    return new StepResponse(result, createdInThisStep)
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
