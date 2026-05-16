import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { deletePayloadProductVariantStep } from "./steps/delete-payload-product-variant"
import { recordPayloadSyncStatusStep } from "./steps/record-payload-sync-status"

export const deletePayloadProductVariantWorkflow = createWorkflow(
  "delete-payload-product-variant",
  (input: { product_id: string; variant_id: string }) => {
    const sync = deletePayloadProductVariantStep(input)
    recordPayloadSyncStatusStep(sync)
    return new WorkflowResponse(sync)
  }
)
