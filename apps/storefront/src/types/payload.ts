import type { SerializedEditorState } from "lexical"

export type PayloadMedia = {
  id: string
  url?: string | null
  alt?: string | null
  width?: number | null
  height?: number | null
  sizes?: Record<string, { url?: string | null; width?: number | null; height?: number | null }>
}

export type PayloadProductOption = {
  medusa_id: string
  title?: string
  values?: { value: string }[]
}

export type PayloadProductVariant = {
  medusa_id: string
  title?: string
  sku?: string
  option_values?: { option_medusa_id: string; value: string }[]
}

export type PayloadProductFromLink = {
  id: string
  medusa_id: string
  title?: string
  handle?: string
  subtitle?: string
  description?: SerializedEditorState | null
  thumbnail?: PayloadMedia | null
  images?: { image: PayloadMedia }[]
  seo?: { title?: string; description?: string; keywords?: string }
  options?: PayloadProductOption[]
  variants?: PayloadProductVariant[]
}
