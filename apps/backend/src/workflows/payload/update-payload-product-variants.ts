import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { upsertPayloadProductVariantsStep } from "./steps/upsert-payload-product-variants"
import { mapMedusaVariantToPayload } from "../../modules/payload"

type Variant = Parameters<typeof mapMedusaVariantToPayload>[0]

export const updatePayloadProductVariantsWorkflow = createWorkflow(
  "update-payload-product-variants",
  (input: { product_id: string; variants: Variant[] }) => {
    const result = upsertPayloadProductVariantsStep(input)
    return new WorkflowResponse(result)
  }
)
