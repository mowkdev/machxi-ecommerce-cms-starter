import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { deletePayloadProductOptionStep } from "./steps/delete-payload-product-option"

export const deletePayloadProductOptionWorkflow = createWorkflow(
  "delete-payload-product-option",
  (input: { product_id: string; option_id: string }) => {
    const result = deletePayloadProductOptionStep(input)
    return new WorkflowResponse(result)
  }
)
