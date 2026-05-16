import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { deletePayloadProductOptionStep } from "./steps/delete-payload-product-option"
import { recordPayloadSyncStatusStep } from "./steps/record-payload-sync-status"

export const deletePayloadProductOptionWorkflow = createWorkflow(
  "delete-payload-product-option",
  (input: { product_id: string; option_id: string }) => {
    const sync = deletePayloadProductOptionStep(input)
    recordPayloadSyncStatusStep(sync)
    return new WorkflowResponse(sync)
  }
)
