import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createPayloadProductOptionWorkflow } from "../workflows/payload/create-payload-product-option"

export default async function handleOptionCreated({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  try {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({
      entity: "product_option",
      fields: ["id", "title", "product_id", "values.*"],
      filters: { id: event.data.id },
    })
    const option = data?.[0]
    if (!option?.product_id) return
    await createPayloadProductOptionWorkflow.run({
      container,
      input: { product_id: option.product_id, option },
    })
  } catch (err) {
    logger.error(`Payload sync failed for product-option.created (${event.data.id}): ${(err as Error).message}`)
  }
}

export const config: SubscriberConfig = { event: "product-option.created" }
