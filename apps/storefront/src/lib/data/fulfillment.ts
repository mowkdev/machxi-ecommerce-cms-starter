"use server"

import { HttpTypes } from "@medusajs/types"

import { getMedusaSdk } from "@/lib/medusa"
import {
  getAuthHeaders,
  getCacheOptions,
  STORE_CACHE,
} from "@/lib/data/cookies"

export const listCartShippingMethods = async (cartId: string) => {
  const headers = { ...(await getAuthHeaders()) }
  const next = { ...(await getCacheOptions("fulfillment")) }

  const sdk = await getMedusaSdk()
  return sdk.client
    .fetch<HttpTypes.StoreShippingOptionListResponse>(
      `/store/shipping-options`,
      {
        method: "GET",
        query: { cart_id: cartId },
        headers,
        next,
        cache: STORE_CACHE,
      }
    )
    .then(({ shipping_options }) => shipping_options)
    .catch(() => null)
}

export const calculatePriceForShippingOption = async (
  optionId: string,
  cartId: string,
  data?: Record<string, unknown>
) => {
  const headers = { ...(await getAuthHeaders()) }
  const next = { ...(await getCacheOptions("fulfillment")) }
  const body: { cart_id: string; data?: Record<string, unknown> } = {
    cart_id: cartId,
  }
  if (data) body.data = data

  const sdk = await getMedusaSdk()
  return sdk.client
    .fetch<{ shipping_option: HttpTypes.StoreCartShippingOption }>(
      `/store/shipping-options/${optionId}/calculate`,
      { method: "POST", body, headers, next }
    )
    .then(({ shipping_option }) => shipping_option)
    .catch(() => null)
}
