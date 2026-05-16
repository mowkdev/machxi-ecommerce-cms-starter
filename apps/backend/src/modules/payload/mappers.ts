import type { PayloadProduct, PayloadProductOption, PayloadProductVariant, PayloadUpsertData } from "./types"

type MedusaOption = { id: string; title?: string; values?: Array<{ value: string }> }
type MedusaVariantOption = { option_id: string; value: string }
type MedusaVariant = {
  id: string
  title?: string
  sku?: string | null
  options?: MedusaVariantOption[]
}
type MedusaProduct = {
  id: string
  title?: string
  handle?: string
  subtitle?: string | null
  description?: string | null
  thumbnail?: string | null
  images?: Array<{ url: string }>
  options?: MedusaOption[]
  variants?: MedusaVariant[]
}

export function mapMedusaProductToPayload(product: MedusaProduct): PayloadUpsertData {
  const data: PayloadUpsertData = { medusa_id: product.id }
  if (product.title !== undefined) data.title = product.title
  if (product.handle !== undefined) data.handle = product.handle
  if (product.subtitle !== undefined && product.subtitle !== null) data.subtitle = product.subtitle
  if (product.description !== undefined && product.description !== null) data.description = product.description
  // NOTE: Medusa `thumbnail` (string URL) and `images` (Array<{ url }>) are NOT
  // mapped to Payload yet. Payload's Media collection requires uploaded media
  // documents (or pasteURL-ingested copies). A future task will ingest these
  // into Payload Media and link them here. Storefront falls back to Medusa
  // images when payload_product.thumbnail/images are absent.
  if (product.options) data.options = product.options.map(mapOption)
  if (product.variants) data.variants = product.variants.map(mapMedusaVariantToPayload)
  return data
}

export function mapMedusaVariantToPayload(variant: MedusaVariant): PayloadProductVariant {
  return {
    medusa_id: variant.id,
    title: variant.title,
    sku: variant.sku ?? undefined,
    option_values: (variant.options ?? []).map((o) => ({
      option_medusa_id: o.option_id,
      value: o.value,
    })),
  }
}

function mapOption(option: MedusaOption): PayloadProductOption {
  return {
    medusa_id: option.id,
    title: option.title,
    values: option.values?.map((v) => ({ value: v.value })),
  }
}

export type { PayloadProduct }
