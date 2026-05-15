"use server"

import { HttpTypes } from "@medusajs/types"
import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"

import { sdk } from "@/lib/medusa"
import medusaError from "@/lib/util/medusa-error"
import {
  getAuthHeaders,
  getCacheOptions,
  getCacheTag,
  getCartId,
  removeAuthToken,
  removeCartId,
  setAuthToken,
  STORE_CACHE,
} from "@/lib/data/cookies"

export const retrieveCustomer =
  async (): Promise<HttpTypes.StoreCustomer | null> => {
    const authHeaders = await getAuthHeaders()
    if (!Object.keys(authHeaders).length) return null

    const next = {
      ...(await getCacheOptions("customers")),
    }

    return await sdk.client
      .fetch<{ customer: HttpTypes.StoreCustomer }>(`/store/customers/me`, {
        method: "GET",
        query: { fields: "*orders" },
        headers: authHeaders,
        next,
        cache: STORE_CACHE,
      })
      .then(({ customer }) => customer)
      .catch(() => null)
  }

export const updateCustomer = async (body: HttpTypes.StoreUpdateCustomer) => {
  const headers = { ...(await getAuthHeaders()) }
  const updated = await sdk.store.customer
    .update(body, {}, headers)
    .then(({ customer }) => customer)
    .catch(medusaError)

  revalidateTag(await getCacheTag("customers"))
  return updated
}

export async function transferCart() {
  const cartId = await getCartId()
  if (!cartId) return

  const headers = await getAuthHeaders()
  await sdk.store.cart.transferCart(cartId, {}, headers)
  revalidateTag(await getCacheTag("carts"))
}

export async function login(
  _currentState: unknown,
  formData: FormData
): Promise<string | undefined> {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  try {
    const token = await sdk.auth.login("customer", "emailpass", {
      email,
      password,
    })
    await setAuthToken(token as string)
    revalidateTag(await getCacheTag("customers"))
  } catch (error) {
    return String(error)
  }

  try {
    await transferCart()
  } catch (error) {
    return String(error)
  }
}

export async function signup(
  _currentState: unknown,
  formData: FormData
): Promise<HttpTypes.StoreCustomer | string> {
  const password = formData.get("password") as string
  const customerForm = {
    email: formData.get("email") as string,
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    phone: (formData.get("phone") as string) || undefined,
  }

  try {
    const registerToken = await sdk.auth.register("customer", "emailpass", {
      email: customerForm.email,
      password,
    })
    await setAuthToken(registerToken as string)

    const headers = { ...(await getAuthHeaders()) }

    const { customer: createdCustomer } = await sdk.store.customer.create(
      customerForm,
      {},
      headers
    )

    const loginToken = await sdk.auth.login("customer", "emailpass", {
      email: customerForm.email,
      password,
    })
    await setAuthToken(loginToken as string)

    revalidateTag(await getCacheTag("customers"))
    await transferCart()

    return createdCustomer
  } catch (error) {
    return String(error)
  }
}

export async function signout(countryCode: string) {
  await sdk.auth.logout()
  await removeAuthToken()
  revalidateTag(await getCacheTag("customers"))
  await removeCartId()
  revalidateTag(await getCacheTag("carts"))
  redirect(`/${countryCode}/account`)
}

export const addCustomerAddress = async (
  currentState: Record<string, unknown>,
  formData: FormData
): Promise<{ success: boolean; error: string | null }> => {
  const isDefaultBilling = (currentState.isDefaultBilling as boolean) || false
  const isDefaultShipping = (currentState.isDefaultShipping as boolean) || false

  const address = {
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    company: (formData.get("company") as string) || "",
    address_1: formData.get("address_1") as string,
    address_2: (formData.get("address_2") as string) || "",
    city: formData.get("city") as string,
    postal_code: formData.get("postal_code") as string,
    province: (formData.get("province") as string) || "",
    country_code: formData.get("country_code") as string,
    phone: (formData.get("phone") as string) || "",
    is_default_billing: isDefaultBilling,
    is_default_shipping: isDefaultShipping,
  }

  const headers = { ...(await getAuthHeaders()) }

  return sdk.store.customer
    .createAddress(address, {}, headers)
    .then(async () => {
      revalidateTag(await getCacheTag("customers"))
      return { success: true, error: null }
    })
    .catch((err: Error) => ({ success: false, error: err.toString() }))
}

export const deleteCustomerAddress = async (
  addressId: string
): Promise<{ success: boolean; error: string | null }> => {
  const headers = { ...(await getAuthHeaders()) }

  return sdk.store.customer
    .deleteAddress(addressId, headers)
    .then(async () => {
      revalidateTag(await getCacheTag("customers"))
      return { success: true, error: null }
    })
    .catch((err: Error) => ({ success: false, error: err.toString() }))
}

export async function requestPasswordReset(
  _currentState: unknown,
  formData: FormData
): Promise<{ ok: boolean; error: string | null }> {
  const email = (formData.get("email") as string)?.trim()
  if (!email) return { ok: false, error: "Email is required" }

  try {
    await sdk.auth.resetPassword("customer", "emailpass", { identifier: email })
    return { ok: true, error: null }
  } catch (error) {
    // We intentionally still return ok=true so we don't leak whether the
    // email exists. Surface the error only for unexpected failures.
    if (process.env.NODE_ENV === "development") {
      console.error("resetPassword failed:", error)
    }
    return { ok: true, error: null }
  }
}

export async function resetPassword(
  _currentState: unknown,
  formData: FormData
): Promise<{ ok: boolean; error: string | null }> {
  const password = formData.get("password") as string
  const token = formData.get("token") as string
  const email = formData.get("email") as string
  if (!password || !token || !email) {
    return { ok: false, error: "Missing token or password" }
  }

  try {
    await sdk.auth.updateProvider(
      "customer",
      "emailpass",
      { email, password },
      token
    )
    return { ok: true, error: null }
  } catch (error) {
    return { ok: false, error: String(error) }
  }
}

export const updateCustomerAddress = async (
  currentState: Record<string, unknown>,
  formData: FormData
): Promise<{ success: boolean; error: string | null }> => {
  const addressId =
    (currentState.addressId as string) || (formData.get("addressId") as string)

  if (!addressId) {
    return { success: false, error: "Address ID is required" }
  }

  const address = {
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    company: (formData.get("company") as string) || "",
    address_1: formData.get("address_1") as string,
    address_2: (formData.get("address_2") as string) || "",
    city: formData.get("city") as string,
    postal_code: formData.get("postal_code") as string,
    province: (formData.get("province") as string) || "",
    country_code: formData.get("country_code") as string,
  } as HttpTypes.StoreUpdateCustomerAddress

  const phone = formData.get("phone") as string
  if (phone) address.phone = phone

  const headers = { ...(await getAuthHeaders()) }

  return sdk.store.customer
    .updateAddress(addressId, address, {}, headers)
    .then(async () => {
      revalidateTag(await getCacheTag("customers"))
      return { success: true, error: null }
    })
    .catch((err: Error) => ({ success: false, error: err.toString() }))
}
