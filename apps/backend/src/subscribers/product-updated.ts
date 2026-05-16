import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updatePayloadProductsWorkflow } from "../workflows/payload/update-payload-products"

export default async function handleProductUpdated({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  try {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "title", "handle", "subtitle", "description", "options.*", "variants.*", "variants.options.*"],
      filters: { id: event.data.id },
    })
    if (!products?.length) return
    await updatePayloadProductsWorkflow.run({ container, input: { products } })
  } catch (err) {
    logger.error(`Payload sync failed for product.updated (${event.data.id}): ${(err as Error).message}`)
  }
}

export const config: SubscriberConfig = { event: "product.updated" }
