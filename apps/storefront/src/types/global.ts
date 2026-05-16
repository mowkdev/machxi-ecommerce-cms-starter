import type { HttpTypes } from "@medusajs/types"
import type { PayloadProductFromLink } from "./payload"

export type StoreProductWithPayload = HttpTypes.StoreProduct & {
  payload_product?: PayloadProductFromLink | null
}
