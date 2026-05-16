import type { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createPayloadProductsWorkflow } from "../../../../../../workflows/payload/create-payload-products"
import { updatePayloadProductsWorkflow } from "../../../../../../workflows/payload/update-payload-products"
import type { SyncResult } from "../../../../../../workflows/payload/steps/record-payload-sync-status"

const PRODUCT_FIELDS = [
  "id",
  "title",
  "handle",
  "subtitle",
  "description",
  "options.*",
  "variants.*",
  "variants.options.*",
  "payload_product.id",
]

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const productId = req.params.id
  if (!productId) {
    res.status(400).json({ error: "Product id is required" })
    return
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "product",
    fields: PRODUCT_FIELDS,
    filters: { id: productId },
  })

  type ProductWithLink = (typeof data)[number] & { payload_product?: { id: string } | null }
  const product = data?.[0] as ProductWithLink | undefined
  if (!product) {
    res.status(404).json({ error: `Product '${productId}' not found` })
    return
  }

  const workflow = product.payload_product
    ? updatePayloadProductsWorkflow
    : createPayloadProductsWorkflow

  const { result } = await workflow.run({
    container: req.scope,
    input: { products: [product] },
  })

  const syncResult: SyncResult | undefined = (result as { results?: SyncResult[] })?.results?.[0]
  const ok = syncResult?.status === "success"

  res.status(ok ? 200 : 502).json({
    ok,
    product_id: productId,
    status: syncResult?.status ?? "failed",
    error: syncResult?.error ?? null,
  })
}
