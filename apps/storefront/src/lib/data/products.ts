"use server"

import { HttpTypes } from "@medusajs/types"
import { sdk } from "@/lib/medusa"
import { getAuthHeaders, getCacheOptions, STORE_CACHE } from "./cookies"
import { getRegion, retrieveRegion } from "./regions"

const PRODUCT_FIELDS =
  "*variants.calculated_price,+variants.inventory_quantity,*variants.options,*options,*options.values,*images,+metadata,+tags,+payload_product.*"

type ListProductsArgs = {
  query?: HttpTypes.FindParams & HttpTypes.StoreProductListParams
  countryCode?: string
  regionId?: string
}

async function resolveRegion(
  countryCode?: string,
  regionId?: string
): Promise<HttpTypes.StoreRegion | null | undefined> {
  if (regionId) {
    return retrieveRegion(regionId)
  }
  if (countryCode) {
    return getRegion(countryCode)
  }
  return null
}

export async function listProducts({
  query = {},
  countryCode,
  regionId,
}: ListProductsArgs): Promise<{
  products: HttpTypes.StoreProduct[]
  count: number
  offset: number
  limit: number
}> {
  if (!countryCode && !regionId) {
    throw new Error("listProducts: countryCode or regionId is required")
  }

  const region = await resolveRegion(countryCode, regionId)

  if (!region) {
    return { products: [], count: 0, offset: 0, limit: query.limit ?? 20 }
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("products")),
  }

  const { products, count, offset, limit } = await sdk.client.fetch<{
    products: HttpTypes.StoreProduct[]
    count: number
    offset: number
    limit: number
  }>(`/store/products`, {
    method: "GET",
    query: {
      limit: 20,
      ...query,
      region_id: region.id,
      fields: PRODUCT_FIELDS,
    },
    headers,
    next,
    cache: STORE_CACHE,
  })

  return {
    products: products ?? [],
    count: count ?? 0,
    offset: offset ?? 0,
    limit: limit ?? 20,
  }
}

export async function getProductByHandle(
  handle: string,
  countryCode: string
): Promise<HttpTypes.StoreProduct | null> {
  const { products } = await listProducts({
    countryCode,
    query: { handle, limit: 1 },
  })

  return products[0] ?? null
}
