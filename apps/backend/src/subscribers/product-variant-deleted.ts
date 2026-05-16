import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { deletePayloadProductVariantWorkflow } from "../workflows/payload/delete-payload-product-variant"

export default async function handleVariantDeleted({
  event,
  container,
}: SubscriberArgs<{ id: string; product_id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  try {
    if (!event.data.product_id) return
    await deletePayloadProductVariantWorkflow.run({
      container,
      input: { product_id: event.data.product_id, variant_id: event.data.id },
    })
  } catch (err) {
    logger.error(`Payload sync failed for product-variant.deleted (${event.data.id}): ${(err as Error).message}`)
  }
}

export const config: SubscriberConfig = { event: "product-variant.deleted" }
