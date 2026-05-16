import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createPayloadProductsWorkflow } from "../workflows/payload/create-payload-products"

type ProductCreatedEvent = { data: { id: string } }

export default async function handleProductCreated({
  event,
  container,
}: SubscriberArgs<ProductCreatedEvent["data"]>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  try {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "title", "handle", "subtitle", "description", "thumbnail", "options.*", "variants.*", "variants.options.*"],
      filters: { id: event.data.id },
    })
    if (!products?.length) return
    await createPayloadProductsWorkflow.run({ container, input: { products } })
  } catch (err) {
    logger.error(`Payload sync failed for product.created (${event.data.id}): ${(err as Error).message}`)
  }
}

export const config: SubscriberConfig = { event: "product.created" }
