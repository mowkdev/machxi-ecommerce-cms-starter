import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PAYLOAD_MODULE, mapMedusaProductToPayload } from "../../../modules/payload"
import type { PayloadModuleService } from "../../../modules/payload"
import type { SyncResult, SyncResultsInput } from "./record-payload-sync-status"
import { concurrentMap } from "../../../utils/concurrent-map"

type Product = Parameters<typeof mapMedusaProductToPayload>[0]

type Input = { products: Product[] }

type CreatedRecord = { payload_id: string; medusa_id: string }

const PAYLOAD_WRITE_CONCURRENCY = 5

export const createPayloadProductsStep = createStep(
  "create-payload-products",
  async (input: Input, { container }): Promise<StepResponse<SyncResultsInput, CreatedRecord[]>> => {
    const service = container.resolve<PayloadModuleService>(PAYLOAD_MODULE)
    const createdInThisStep: CreatedRecord[] = []

    const results: SyncResult[] = await concurrentMap(
      input.products,
      PAYLOAD_WRITE_CONCURRENCY,
      async (product): Promise<SyncResult> => {
        try {
          const existing = await service.find("products", {
            where: { medusa_id: { equals: product.id } },
            limit: 1,
          })
          if (existing.docs[0]) {
            return { medusa_id: product.id, status: "success" }
          }
          const created = await service.create("products", mapMedusaProductToPayload(product))
          // JS is single-threaded; push is safe across awaits.
          createdInThisStep.push({ payload_id: created.doc.id, medusa_id: product.id })
          return { medusa_id: product.id, status: "success" }
        } catch (err) {
          return {
            medusa_id: product.id,
            status: "failed",
            error: (err as Error).message,
          }
        }
      }
    )

    return new StepResponse({ results }, createdInThisStep)
  },
  async (createdInThisStep, { container }) => {
    if (!createdInThisStep?.length) return
    const service = container.resolve<PayloadModuleService>(PAYLOAD_MODULE)
    for (const c of createdInThisStep) {
      try {
        await service.delete("products", c.payload_id)
      } catch {
        // best-effort compensation
      }
    }
  }
)
