import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PAYLOAD_MODULE } from "../../../modules/payload"
import type { PayloadModuleService, PayloadProduct, PayloadProductOption } from "../../../modules/payload"

type Option = { id: string; title?: string; values?: Array<{ value: string }> }
type Input = { product_id: string; options: Option[] }

type Snapshot = { payload_id: string; previous: PayloadProductOption[] }

export const upsertPayloadProductOptionsStep = createStep(
  "upsert-payload-product-options",
  async (input: Input, { container }) => {
    const service = container.resolve<PayloadModuleService>(PAYLOAD_MODULE)
    const found = await service.find<PayloadProduct>("products", {
      where: { medusa_id: { equals: input.product_id } },
      limit: 1,
    })
    const product = found.docs[0]
    if (!product) return new StepResponse(null, null)
    const snapshot: Snapshot = { payload_id: product.id, previous: product.options ?? [] }
    const byId = new Map(snapshot.previous?.map((o) => [o.medusa_id, o]) ?? [])
    for (const opt of input.options) {
      byId.set(opt.id, {
        medusa_id: opt.id,
        title: opt.title,
        values: opt.values,
      })
    }
    await service.update("products", product.id, { options: Array.from(byId.values()) })
    return new StepResponse(snapshot, snapshot)
  },
  async (snapshot, { container }) => {
    if (!snapshot) return
    const service = container.resolve<PayloadModuleService>(PAYLOAD_MODULE)
    try {
      await service.update("products", snapshot.payload_id, { options: snapshot.previous })
    } catch {
      // best-effort compensation
    }
  }
)
