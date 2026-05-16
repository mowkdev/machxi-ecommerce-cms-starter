import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { upsertPayloadProductOptionsStep } from "./steps/upsert-payload-product-options"

type Option = { id: string; title?: string; values?: Array<{ value: string }> }

export const createPayloadProductOptionWorkflow = createWorkflow(
  "create-payload-product-option",
  (input: { product_id: string; option: Option }) => {
    const result = upsertPayloadProductOptionsStep({
      product_id: input.product_id,
      options: [input.option],
    })
    return new WorkflowResponse(result)
  }
)
