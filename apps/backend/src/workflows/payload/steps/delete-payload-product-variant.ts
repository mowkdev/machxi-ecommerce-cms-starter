import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PAYLOAD_MODULE } from "../../../modules/payload"
import type { PayloadModuleService, PayloadProduct, PayloadProductVariant } from "../../../modules/payload"
import type { SyncResultsInput } from "./record-payload-sync-status"

type Input = { product_id: string; variant_id: string }

type Snapshot = { payload_id: string; previous: PayloadProductVariant[] } | null

export const deletePayloadProductVariantStep = createStep(
  "delete-payload-product-variant",
  async (input: Input, { container }): Promise<StepResponse<SyncResultsInput, Snapshot>> => {
    const service = container.resolve<PayloadModuleService>(PAYLOAD_MODULE)
    try {
      const found = await service.find<PayloadProduct>("products", {
        where: { medusa_id: { equals: input.product_id } },
        limit: 1,
      })
      const product = found.docs[0]
      if (!product) return new StepResponse({ results: [] }, null)

      const snapshot: Snapshot = { payload_id: product.id, previous: product.variants ?? [] }
      const remaining = (product.variants ?? []).filter((v) => v.medusa_id !== input.variant_id)
      await service.update("products", product.id, { variants: remaining })
      return new StepResponse(
        { results: [{ medusa_id: input.product_id, status: "success" }] },
        snapshot
      )
    } catch (err) {
      return new StepResponse(
        {
          results: [
            {
              medusa_id: input.product_id,
              status: "failed",
              error: (err as Error).message,
            },
          ],
        },
        null
      )
    }
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
