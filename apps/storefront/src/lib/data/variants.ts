"use server"

import { HttpTypes } from "@medusajs/types"

import { sdk } from "@/lib/medusa"
import { getAuthHeaders, getCacheOptions } from "./cookies"

export const retrieveVariant = async (
  variant_id: string
): Promise<HttpTypes.StoreProductVariant | null> => {
  const authHeaders = await getAuthHeaders()

  if (!authHeaders || !Object.keys(authHeaders).length) return null

  const next = {
    ...(await getCacheOptions("variants")),
  }

  return sdk.client
    .fetch<{ variant: HttpTypes.StoreProductVariant }>(
      `/store/product-variants/${variant_id}`,
      {
        method: "GET",
        query: {
          fields: "*images",
        },
        headers: { ...authHeaders },
        next,
        cache: "force-cache",
      }
    )
    .then(({ variant }) => variant)
    .catch(() => null)
}
