import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PAYLOAD_MODULE } from "../../../modules/payload"
import type { PayloadModuleService, PayloadProduct, PayloadProductVariant } from "../../../modules/payload"

type Input = { product_id: string; variant_id: string }

type Snapshot = { payload_id: string; previous: PayloadProductVariant[] }

export const deletePayloadProductVariantStep = createStep(
  "delete-payload-product-variant",
  async (input: Input, { container }) => {
    const service = container.resolve<PayloadModuleService>(PAYLOAD_MODULE)
    const found = await service.find<PayloadProduct>("products", {
      where: { medusa_id: { equals: input.product_id } },
      limit: 1,
    })
    const product = found.docs[0]
    if (!product) return new StepResponse(null, null)
    const snapshot: Snapshot = { payload_id: product.id, previous: product.variants ?? [] }
    const remaining = (product.variants ?? []).filter((v) => v.medusa_id !== input.variant_id)
    await service.update("products", product.id, { variants: remaining })
    return new StepResponse(snapshot, snapshot)
  },
  async (snapshot, { container }) => {
    if (!snapshot) return
    const service = container.resolve<PayloadModuleService>(PAYLOAD_MODULE)
    try {
      await service.update("products", snapshot.payload_id, { variants: snapshot.previous })
    } catch {
      // best-effort compensation
    }
  }
)
