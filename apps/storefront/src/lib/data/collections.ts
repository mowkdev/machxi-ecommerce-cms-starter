"use server"

import { HttpTypes } from "@medusajs/types"

import { sdk } from "@/lib/medusa"
import { getCacheOptions, STORE_CACHE } from "@/lib/data/cookies"

export const retrieveCollection = async (id: string) => {
  const next = { ...(await getCacheOptions("collections")) }

  return await sdk.client
    .fetch<{
      collection: HttpTypes.StoreCollection
    }>(`/store/collections/${id}`, { next, cache: STORE_CACHE })
    .then(({ collection }) => collection)
}

export const listCollections = async (
  queryParams: Record<string, string> = {}
): Promise<{ collections: HttpTypes.StoreCollection[]; count: number }> => {
  const next = { ...(await getCacheOptions("collections")) }

  queryParams.limit ||= "100"
  queryParams.offset ||= "0"

  return await sdk.client
    .fetch<{
      collections: HttpTypes.StoreCollection[]
      count: number
    }>("/store/collections", { query: queryParams, next, cache: STORE_CACHE })
    .then(({ collections }) => ({ collections, count: collections.length }))
}

export const getCollectionByHandle = async (
  handle: string
): Promise<HttpTypes.StoreCollection | null> => {
  const next = { ...(await getCacheOptions("collections")) }

  return await sdk.client
    .fetch<HttpTypes.StoreCollectionListResponse>(`/store/collections`, {
      query: { handle, fields: "*products" },
      next,
      cache: STORE_CACHE,
    })
    .then(({ collections }) => collections[0] || null)
}
