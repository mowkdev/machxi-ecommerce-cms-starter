import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PAYLOAD_MODULE, mapMedusaVariantToPayload } from "../../../modules/payload"
import type { PayloadModuleService, PayloadProduct } from "../../../modules/payload"

type Variant = Parameters<typeof mapMedusaVariantToPayload>[0]
type Input = { product_id: string; variants: Variant[] }

type Snapshot = { payload_id: string; previous: PayloadProduct["variants"] }

export const upsertPayloadProductVariantsStep = createStep(
  "upsert-payload-product-variants",
  async (input: Input, { container }) => {
    const service = container.resolve<PayloadModuleService>(PAYLOAD_MODULE)
    const found = await service.find<PayloadProduct>("products", {
      where: { medusa_id: { equals: input.product_id } },
      limit: 1,
    })
    const product = found.docs[0]
    if (!product) {
      return new StepResponse(null, null)
    }
    const snapshot: Snapshot = { payload_id: product.id, previous: product.variants ?? [] }
    const byId = new Map(snapshot.previous?.map((v) => [v.medusa_id, v]) ?? [])
    for (const variant of input.variants) {
      byId.set(variant.id, mapMedusaVariantToPayload(variant))
    }
    await service.update("products", product.id, { variants: Array.from(byId.values()) })
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
