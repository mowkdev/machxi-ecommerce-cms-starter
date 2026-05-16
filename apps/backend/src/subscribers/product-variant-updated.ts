import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updatePayloadProductVariantsWorkflow } from "../workflows/payload/update-payload-product-variants"

export default async function handleVariantUpdated({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  try {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({
      entity: "variant",
      fields: ["id", "title", "sku", "product_id", "options.*"],
      filters: { id: event.data.id },
    })
    const variant = data?.[0]
    if (!variant?.product_id) return
    await updatePayloadProductVariantsWorkflow.run({
      container,
      input: { product_id: variant.product_id, variants: [variant] },
    })
  } catch (err) {
    logger.error(`Payload sync failed for product-variant.updated (${event.data.id}): ${(err as Error).message}`)
  }
}

export const config: SubscriberConfig = { event: "product-variant.updated" }
