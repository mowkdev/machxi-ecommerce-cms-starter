"use server"

import { HttpTypes } from "@medusajs/types"
import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"

import { getMedusaSdk } from "@/lib/medusa"
import medusaError from "@/lib/util/medusa-error"
import {
  getAuthHeaders,
  getCacheOptions,
  getCacheTag,
  getCartId,
  getCountryCode,
  removeCartId,
  setCartId,
  setCountryCode,
  STORE_CACHE,
} from "@/lib/data/cookies"
import { getRegion } from "@/lib/data/regions"
import { getLocale } from "@/lib/data/locale-actions"
import { localeToMedusa } from "@/i18n/localization"

const DEFAULT_CART_FIELDS =
  "*items, *region, *items.product, *items.variant, *items.thumbnail, *items.metadata, +items.total, *promotions, +shipping_methods.name"

export async function retrieveCart(
  cartId?: string,
  fields: string = DEFAULT_CART_FIELDS
): Promise<HttpTypes.StoreCart | null> {
  const id = cartId || (await getCartId())
  if (!id) return null

  const headers = { ...(await getAuthHeaders()) }
  const next = { ...(await getCacheOptions("carts")) }

  const sdk = await getMedusaSdk()
  return await sdk.client
    .fetch<HttpTypes.StoreCartResponse>(`/store/carts/${id}`, {
      method: "GET",
      query: { fields },
      headers,
      next,
      cache: STORE_CACHE,
    })
    .then(({ cart }) => cart)
    .catch(() => null)
}

export async function getOrSetCart(
  countryCode: string
): Promise<HttpTypes.StoreCart> {
  const region = await getRegion(countryCode)
  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`)
  }

  let cart = await retrieveCart(undefined, "id,region_id")
  const headers = { ...(await getAuthHeaders()) }

  if (!cart) {
    const locale = await getLocale()
    const sdk = await getMedusaSdk()
    const { cart: created } = await sdk.store.cart.create(
      {
        region_id: region.id,
        locale: locale ? localeToMedusa(locale) : undefined,
      },
      {},
      headers
    )
    cart = created
    await setCartId(cart.id)
    revalidateTag(await getCacheTag("carts"))
  }

  if (cart && cart.region_id !== region.id) {
    const sdk = await getMedusaSdk()
    await sdk.store.cart.update(cart.id, { region_id: region.id }, {}, headers)
    revalidateTag(await getCacheTag("carts"))
  }

  return cart
}

export async function updateCart(data: HttpTypes.StoreUpdateCart) {
  const cartId = await getCartId()
  if (!cartId) {
    throw new Error("No existing cart found, please create one before updating")
  }

  const headers = { ...(await getAuthHeaders()) }

  const sdk = await getMedusaSdk()
  return sdk.store.cart
    .update(cartId, data, {}, headers)
    .then(async ({ cart }) => {
      revalidateTag(await getCacheTag("carts"))
      revalidateTag(await getCacheTag("fulfillment"))
      return cart
    })
    .catch(medusaError)
}

export async function addToCart({
  variantId,
  quantity,
}: {
  variantId: string
  quantity: number
}) {
  if (!variantId) throw new Error("Missing variant ID when adding to cart")

  const countryCode = await getCountryCode()
  if (!countryCode) {
    throw new Error("Country code not found. Please select a country.")
  }

  const cart = await getOrSetCart(countryCode)
  if (!cart) throw new Error("Error retrieving or creating cart")

  const headers = { ...(await getAuthHeaders()) }

  const sdk = await getMedusaSdk()
  await sdk.store.cart
    .createLineItem(cart.id, { variant_id: variantId, quantity }, {}, headers)
    .then(async () => {
      revalidateTag(await getCacheTag("carts"))
      revalidateTag(await getCacheTag("fulfillment"))
    })
    .catch(medusaError)
}

export async function updateLineItem({
  lineId,
  quantity,
}: {
  lineId: string
  quantity: number
}) {
  if (!lineId) throw new Error("Missing lineItem ID when updating line item")

  const cartId = await getCartId()
  if (!cartId) throw new Error("Missing cart ID when updating line item")

  const headers = { ...(await getAuthHeaders()) }

  const sdk = await getMedusaSdk()
  await sdk.store.cart
    .updateLineItem(cartId, lineId, { quantity }, {}, headers)
    .then(async () => {
      revalidateTag(await getCacheTag("carts"))
      revalidateTag(await getCacheTag("fulfillment"))
    })
    .catch(medusaError)
}

export async function deleteLineItem(lineId: string) {
  if (!lineId) throw new Error("Missing lineItem ID when deleting line item")

  const cartId = await getCartId()
  if (!cartId) throw new Error("Missing cart ID when deleting line item")

  const headers = { ...(await getAuthHeaders()) }

  const sdk = await getMedusaSdk()
  await sdk.store.cart
    .deleteLineItem(cartId, lineId, {}, headers)
    .then(async () => {
      revalidateTag(await getCacheTag("carts"))
      revalidateTag(await getCacheTag("fulfillment"))
    })
    .catch(medusaError)
}

export async function setShippingMethod({
  cartId,
  shippingMethodId,
}: {
  cartId: string
  shippingMethodId: string
}) {
  const headers = { ...(await getAuthHeaders()) }

  const sdk = await getMedusaSdk()
  return sdk.store.cart
    .addShippingMethod(cartId, { option_id: shippingMethodId }, {}, headers)
    .then(async () => {
      revalidateTag(await getCacheTag("carts"))
    })
    .catch(medusaError)
}

export async function initiatePaymentSession(
  cart: HttpTypes.StoreCart,
  data: HttpTypes.StoreInitializePaymentSession
) {
  const headers = { ...(await getAuthHeaders()) }

  const sdk = await getMedusaSdk()
  return sdk.store.payment
    .initiatePaymentSession(cart, data, {}, headers)
    .then(async (resp) => {
      revalidateTag(await getCacheTag("carts"))
      return resp
    })
    .catch(medusaError)
}

export async function applyPromotions(codes: string[]) {
  const cartId = await getCartId()
  if (!cartId) throw new Error("No existing cart found")

  const headers = { ...(await getAuthHeaders()) }

  const sdk = await getMedusaSdk()
  return sdk.store.cart
    .update(cartId, { promo_codes: codes }, {}, headers)
    .then(async () => {
      revalidateTag(await getCacheTag("carts"))
      revalidateTag(await getCacheTag("fulfillment"))
    })
    .catch(medusaError)
}

export async function submitPromotionForm(
  _state: unknown,
  formData: FormData
): Promise<string | undefined> {
  const code = formData.get("code") as string
  try {
    await applyPromotions([code])
  } catch (e) {
    return (e as Error).message
  }
}

type CartAddressInput = {
  first_name: string
  last_name: string
  address_1: string
  address_2?: string
  company?: string
  postal_code: string
  city: string
  country_code: string
  province?: string
  phone?: string
}

export type SetAddressesInput = {
  email: string
  shipping_address: CartAddressInput
  billing_address?: CartAddressInput
  same_as_billing: boolean
}

export async function setAddresses(input: SetAddressesInput): Promise<void> {
  const cartId = await getCartId()
  if (!cartId) {
    throw new Error("No existing cart found when setting addresses")
  }

  const shipping = {
    first_name: input.shipping_address.first_name,
    last_name: input.shipping_address.last_name,
    address_1: input.shipping_address.address_1,
    address_2: input.shipping_address.address_2 ?? "",
    company: input.shipping_address.company ?? "",
    postal_code: input.shipping_address.postal_code,
    city: input.shipping_address.city,
    country_code: input.shipping_address.country_code,
    province: input.shipping_address.province ?? "",
    phone: input.shipping_address.phone ?? "",
  }

  const data: HttpTypes.StoreUpdateCart & {
    shipping_address?: CartAddressInput
    billing_address?: CartAddressInput
    email?: string
  } = {
    shipping_address: shipping,
    billing_address: input.same_as_billing
      ? shipping
      : (input.billing_address ?? shipping),
    email: input.email,
  }

  await updateCart(data)
}

export async function placeOrder(cartId?: string) {
  const id = cartId || (await getCartId())
  if (!id) throw new Error("No existing cart found when placing an order")

  const headers = { ...(await getAuthHeaders()) }

  const sdk = await getMedusaSdk()
  const cartRes = await sdk.store.cart
    .complete(id, {}, headers)
    .then(async (res) => {
      revalidateTag(await getCacheTag("carts"))
      return res
    })
    .catch(medusaError)

  if (cartRes?.type === "order") {
    revalidateTag(await getCacheTag("orders"))
    await removeCartId()
    redirect(`/order/${cartRes.order.id}/confirmed`)
  }

  return cartRes.cart
}

export async function updateRegion(countryCode: string, currentPath: string) {
  const cartId = await getCartId()
  const region = await getRegion(countryCode)
  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`)
  }

  await setCountryCode(countryCode)

  if (cartId) {
    await updateCart({ region_id: region.id })
    revalidateTag(await getCacheTag("carts"))
  }

  revalidateTag(await getCacheTag("regions"))
  revalidateTag(await getCacheTag("products"))
  redirect(currentPath || "/")
}

export async function listCartOptions() {
  const cartId = await getCartId()
  const headers = { ...(await getAuthHeaders()) }
  const next = { ...(await getCacheOptions("shippingOptions")) }

  const sdk = await getMedusaSdk()
  return await sdk.client.fetch<{
    shipping_options: HttpTypes.StoreCartShippingOption[]
  }>("/store/shipping-options", {
    query: { cart_id: cartId },
    next,
    headers,
    cache: STORE_CACHE,
  })
}
