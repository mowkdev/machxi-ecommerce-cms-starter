import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PAYLOAD_MODULE, mapMedusaProductToPayload } from "../../../modules/payload"
import type { PayloadModuleService } from "../../../modules/payload"
import type { SyncResult, SyncResultsInput } from "./record-payload-sync-status"

type Product = Parameters<typeof mapMedusaProductToPayload>[0]

type Input = { products: Product[] }

type CreatedRecord = { payload_id: string; medusa_id: string }

export const createPayloadProductsStep = createStep(
  "create-payload-products",
  async (input: Input, { container }): Promise<StepResponse<SyncResultsInput, CreatedRecord[]>> => {
    const service = container.resolve<PayloadModuleService>(PAYLOAD_MODULE)
    const results: SyncResult[] = []
    const createdInThisStep: CreatedRecord[] = []

    for (const product of input.products) {
      try {
        const existing = await service.find("products", {
          where: { medusa_id: { equals: product.id } },
          limit: 1,
        })
        if (existing.docs[0]) {
          results.push({ medusa_id: product.id, status: "success" })
          continue
        }
        const created = await service.create("products", mapMedusaProductToPayload(product))
        createdInThisStep.push({ payload_id: created.doc.id, medusa_id: product.id })
        results.push({ medusa_id: product.id, status: "success" })
      } catch (err) {
        results.push({
          medusa_id: product.id,
          status: "failed",
          error: (err as Error).message,
        })
      }
    }

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
