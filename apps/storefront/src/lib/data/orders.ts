"use server"

import { HttpTypes } from "@medusajs/types"

import { getMedusaSdk } from "@/lib/medusa"
import medusaError from "@/lib/util/medusa-error"
import {
  getAuthHeaders,
  getCacheOptions,
  STORE_CACHE,
} from "@/lib/data/cookies"

export const retrieveOrder = async (id: string) => {
  const headers = { ...(await getAuthHeaders()) }
  const next = { ...(await getCacheOptions("orders")) }

  const sdk = await getMedusaSdk()
  return sdk.client
    .fetch<HttpTypes.StoreOrderResponse>(`/store/orders/${id}`, {
      method: "GET",
      query: {
        fields:
          "*payment_collections.payments,*items,*items.metadata,*items.variant,*items.product",
      },
      headers,
      next,
      cache: STORE_CACHE,
    })
    .then(({ order }) => order)
    .catch((err) => medusaError(err))
}

export const listOrders = async (
  limit = 10,
  offset = 0,
  filters?: Record<string, unknown>
) => {
  const headers = { ...(await getAuthHeaders()) }
  const next = { ...(await getCacheOptions("orders")) }

  const sdk = await getMedusaSdk()
  return sdk.client
    .fetch<HttpTypes.StoreOrderListResponse>(`/store/orders`, {
      method: "GET",
      query: {
        limit,
        offset,
        order: "-created_at",
        fields: "*items,+items.metadata,*items.variant,*items.product",
        ...filters,
      },
      headers,
      next,
      cache: STORE_CACHE,
    })
    .then(({ orders }) => orders)
    .catch((err) => medusaError(err))
}

type TransferState = {
  success: boolean
  error: string | null
  order: HttpTypes.StoreOrder | null
}

export const createTransferRequest = async (
  _state: TransferState,
  formData: FormData
): Promise<TransferState> => {
  const id = formData.get("order_id") as string
  if (!id) {
    return { success: false, error: "Order ID is required", order: null }
  }

  const headers = await getAuthHeaders()

  const sdk = await getMedusaSdk()
  return await sdk.store.order
    .requestTransfer(id, {}, { fields: "id, email" }, headers)
    .then(({ order }) => ({ success: true, error: null, order }))
    .catch((err: Error) => ({
      success: false,
      error: err.message,
      order: null,
    }))
}

export const acceptTransferRequest = async (id: string, token: string) => {
  const headers = await getAuthHeaders()
  const sdk = await getMedusaSdk()
  return await sdk.store.order
    .acceptTransfer(id, { token }, {}, headers)
    .then(({ order }) => ({ success: true, error: null, order }))
    .catch((err: Error) => ({
      success: false,
      error: err.message,
      order: null,
    }))
}

export const declineTransferRequest = async (id: string, token: string) => {
  const headers = await getAuthHeaders()
  const sdk = await getMedusaSdk()
  return await sdk.store.order
    .declineTransfer(id, { token }, {}, headers)
    .then(({ order }) => ({ success: true, error: null, order }))
    .catch((err: Error) => ({
      success: false,
      error: err.message,
      order: null,
    }))
}
