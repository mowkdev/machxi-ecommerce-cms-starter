import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PAYLOAD_MODULE, mapMedusaProductToPayload } from "../../../modules/payload"
import type { PayloadModuleService, PayloadProduct } from "../../../modules/payload"

type Product = Parameters<typeof mapMedusaProductToPayload>[0]

type Input = { products: Product[] }

type Snapshot = { payload_id: string; previous: Partial<PayloadProduct> | null }

export const updatePayloadProductsStep = createStep(
  "update-payload-products",
  async (input: Input, { container }) => {
    const service = container.resolve<PayloadModuleService>(PAYLOAD_MODULE)
    const snapshots: Snapshot[] = []
    for (const product of input.products) {
      const found = await service.find<PayloadProduct>("products", {
        where: { medusa_id: { equals: product.id } },
        limit: 1,
        depth: 0,
      })
      const existing = found.docs[0]
      if (!existing) continue
      snapshots.push({ payload_id: existing.id, previous: existing })
      await service.update("products", existing.id, mapMedusaProductToPayload(product))
    }
    return new StepResponse(snapshots, snapshots)
  },
  async (snapshots, { container }) => {
    if (!snapshots?.length) return
    const service = container.resolve<PayloadModuleService>(PAYLOAD_MODULE)
    for (const snap of snapshots) {
      if (!snap.previous) continue
      try {
        await service.update("products", snap.payload_id, snap.previous as Record<string, unknown>)
      } catch {
        // best-effort compensation
      }
    }
  }
)
