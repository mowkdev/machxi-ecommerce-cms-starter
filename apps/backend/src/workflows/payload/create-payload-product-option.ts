import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { upsertPayloadProductOptionsStep } from "./steps/upsert-payload-product-options"
import { recordPayloadSyncStatusStep } from "./steps/record-payload-sync-status"

type Option = { id: string; title?: string; values?: Array<{ value: string }> }

export const createPayloadProductOptionWorkflow = createWorkflow(
  "create-payload-product-option",
  (input: { product_id: string; option: Option }) => {
    const sync = upsertPayloadProductOptionsStep({
      product_id: input.product_id,
      options: [input.option],
    })
    recordPayloadSyncStatusStep(sync)
    return new WorkflowResponse(sync)
  }
)
