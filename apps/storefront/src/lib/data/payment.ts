"use server"

import { HttpTypes } from "@medusajs/types"

import { getMedusaSdk } from "@/lib/medusa"
import {
  getAuthHeaders,
  getCacheOptions,
  STORE_CACHE,
} from "@/lib/data/cookies"

export const listCartPaymentMethods = async (regionId: string) => {
  const headers = { ...(await getAuthHeaders()) }
  const next = { ...(await getCacheOptions("payment_providers")) }

  const sdk = await getMedusaSdk()
  return sdk.client
    .fetch<HttpTypes.StorePaymentProviderListResponse>(
      `/store/payment-providers`,
      {
        method: "GET",
        query: { region_id: regionId },
        headers,
        next,
        cache: STORE_CACHE,
      }
    )
    .then(({ payment_providers }) =>
      payment_providers.sort((a, b) => (a.id > b.id ? 1 : -1))
    )
    .catch(() => null)
}
