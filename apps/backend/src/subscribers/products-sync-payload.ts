import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { PAYLOAD_MODULE } from "../modules/payload"
import type { PayloadModuleService } from "../modules/payload"
import { createPayloadProductsWorkflow } from "../workflows/payload/create-payload-products"

const BATCH_SIZE = 25

export default async function handleProductsSync({ event, container }: SubscriberArgs<unknown>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  try {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "title", "handle", "subtitle", "description", "thumbnail", "options.*", "variants.*", "variants.options.*"],
    })
    if (!products?.length) return
    const service = container.resolve<PayloadModuleService>(PAYLOAD_MODULE)
    const ids = products.map((p: { id: string }) => p.id)
    const existing = await service.list({ product_id: ids })
    const existingIds = new Set(existing.map((p) => p.medusa_id))
    const unsynced = products.filter((p: { id: string }) => !existingIds.has(p.id))
    for (let i = 0; i < unsynced.length; i += BATCH_SIZE) {
      const batch = unsynced.slice(i, i + BATCH_SIZE)
      await createPayloadProductsWorkflow.run({ container, input: { products: batch } })
    }
    logger.info(`Synced ${unsynced.length} products to Payload (${existingIds.size} already present)`)
  } catch (err) {
    logger.error(`Payload bulk sync failed: ${(err as Error).message}`)
  }
}

export const config: SubscriberConfig = { event: "products.sync-payload" }
