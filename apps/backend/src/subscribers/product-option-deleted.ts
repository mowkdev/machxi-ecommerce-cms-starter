import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { deletePayloadProductOptionWorkflow } from "../workflows/payload/delete-payload-product-option"

export default async function handleOptionDeleted({
  event,
  container,
}: SubscriberArgs<{ id: string; product_id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  try {
    if (!event.data.product_id) return
    await deletePayloadProductOptionWorkflow.run({
      container,
      input: { product_id: event.data.product_id, option_id: event.data.id },
    })
  } catch (err) {
    logger.error(`Payload sync failed for product-option.deleted (${event.data.id}): ${(err as Error).message}`)
  }
}

export const config: SubscriberConfig = { event: "product-option.deleted" }
