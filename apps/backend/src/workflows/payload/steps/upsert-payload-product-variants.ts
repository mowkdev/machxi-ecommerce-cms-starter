import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PAYLOAD_MODULE, mapMedusaVariantToPayload } from "../../../modules/payload"
import type { PayloadModuleService, PayloadProduct, PayloadProductVariant } from "../../../modules/payload"
import type { SyncResultsInput } from "./record-payload-sync-status"

type Variant = Parameters<typeof mapMedusaVariantToPayload>[0]
type Input = { product_id: string; variants: Variant[] }

type Snapshot = { payload_id: string; previous: PayloadProductVariant[] } | null

export const upsertPayloadProductVariantsStep = createStep(
  "upsert-payload-product-variants",
  async (input: Input, { container }): Promise<StepResponse<SyncResultsInput, Snapshot>> => {
    const service = container.resolve<PayloadModuleService>(PAYLOAD_MODULE)
    try {
      const found = await service.find<PayloadProduct>("products", {
        where: { medusa_id: { equals: input.product_id } },
        limit: 1,
      })
      const product = found.docs[0]
      if (!product) {
        // Parent Payload product doesn't exist yet — no-op, no metadata write.
        return new StepResponse({ results: [] }, null)
      }
      const snapshot: Snapshot = { payload_id: product.id, previous: product.variants ?? [] }
      const byId = new Map(snapshot.previous?.map((v) => [v.medusa_id, v]) ?? [])
      for (const variant of input.variants) {
        byId.set(variant.id, mapMedusaVariantToPayload(variant))
      }
      await service.update("products", product.id, { variants: Array.from(byId.values()) })
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
