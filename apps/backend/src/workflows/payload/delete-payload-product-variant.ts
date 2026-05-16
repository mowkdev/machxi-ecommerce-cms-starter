import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { deletePayloadProductVariantStep } from "./steps/delete-payload-product-variant"

export const deletePayloadProductVariantWorkflow = createWorkflow(
  "delete-payload-product-variant",
  (input: { product_id: string; variant_id: string }) => {
    const result = deletePayloadProductVariantStep(input)
    return new WorkflowResponse(result)
  }
)
