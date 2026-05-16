import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { deletePayloadProductsStep } from "./steps/delete-payload-products"

export const deletePayloadProductsWorkflow = createWorkflow(
  "delete-payload-products",
  (input: { ids: string[] }) => {
    const deleted = deletePayloadProductsStep(input)
    return new WorkflowResponse(deleted)
  }
)
