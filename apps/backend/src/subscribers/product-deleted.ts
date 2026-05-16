import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { deletePayloadProductsWorkflow } from "../workflows/payload/delete-payload-products"

export default async function handleProductDeleted({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  try {
    await deletePayloadProductsWorkflow.run({ container, input: { ids: [event.data.id] } })
  } catch (err) {
    logger.error(`Payload sync failed for product.deleted (${event.data.id}): ${(err as Error).message}`)
  }
}

export const config: SubscriberConfig = { event: "product.deleted" }
