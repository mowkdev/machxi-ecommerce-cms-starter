import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { upsertPayloadProductVariantsStep } from "./steps/upsert-payload-product-variants"
import { recordPayloadSyncStatusStep } from "./steps/record-payload-sync-status"
import { mapMedusaVariantToPayload } from "../../modules/payload"

type Variant = Parameters<typeof mapMedusaVariantToPayload>[0]

export const createPayloadProductVariantWorkflow = createWorkflow(
  "create-payload-product-variant",
  (input: { product_id: string; variant: Variant }) => {
    const sync = upsertPayloadProductVariantsStep({
      product_id: input.product_id,
      variants: [input.variant],
    })
    recordPayloadSyncStatusStep(sync)
    return new WorkflowResponse(sync)
  }
)
