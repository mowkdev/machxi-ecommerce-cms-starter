import type { SerializedEditorState } from "lexical"

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
  /** Read-only mirror of Medusa's thumbnail URL — Payload no longer owns this asset. */
  thumbnail?: string | null
  seo?: { title?: string; description?: string; keywords?: string }
  options?: PayloadProductOption[]
  variants?: PayloadProductVariant[]
}
