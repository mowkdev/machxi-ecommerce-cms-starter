import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PAYLOAD_MODULE } from "../../../modules/payload"
import type { PayloadModuleService, PayloadProduct, PayloadProductOption } from "../../../modules/payload"
import type { SyncResultsInput } from "./record-payload-sync-status"

type Input = { product_id: string; option_id: string }

type Snapshot = { payload_id: string; previous: PayloadProductOption[] } | null

export const deletePayloadProductOptionStep = createStep(
  "delete-payload-product-option",
  async (input: Input, { container }): Promise<StepResponse<SyncResultsInput, Snapshot>> => {
    const service = container.resolve<PayloadModuleService>(PAYLOAD_MODULE)
    try {
      const found = await service.find<PayloadProduct>("products", {
        where: { medusa_id: { equals: input.product_id } },
        limit: 1,
      })
      const product = found.docs[0]
      if (!product) return new StepResponse({ results: [] }, null)

      const snapshot: Snapshot = { payload_id: product.id, previous: product.options ?? [] }
      const remaining = (product.options ?? []).filter((o) => o.medusa_id !== input.option_id)
      await service.update("products", product.id, { options: remaining })
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
      await service.update("products", snapshot.payload_id, { options: snapshot.previous })
    } catch {
      // best-effort compensation
    }
  }
)
