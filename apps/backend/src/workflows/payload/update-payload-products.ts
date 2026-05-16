import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { updatePayloadProductsStep } from "./steps/update-payload-products"
import { recordPayloadSyncStatusStep } from "./steps/record-payload-sync-status"
import { mapMedusaProductToPayload } from "../../modules/payload"

type Product = Parameters<typeof mapMedusaProductToPayload>[0]

export const updatePayloadProductsWorkflow = createWorkflow(
  "update-payload-products",
  (input: { products: Product[] }) => {
    const sync = updatePayloadProductsStep(input)
    recordPayloadSyncStatusStep(sync)
    return new WorkflowResponse(sync)
  }
)
