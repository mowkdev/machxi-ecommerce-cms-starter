"use server"

import { revalidateTag } from "next/cache"
import { getLocale as getIntlLocale } from "next-intl/server"

import { sdk } from "@/lib/medusa"
import { getAuthHeaders, getCacheTag, getCartId } from "@/lib/data/cookies"
import {
  DEFAULT_LOCALE,
  type LocaleCode,
  isLocaleCode,
  localeToMedusa,
} from "@/i18n/localization"
import { redirect } from "@/i18n/navigation"

/**
 * URL-driven locale read via next-intl. Returns null if invoked outside a
 * request scope (eg. during a build-time prerender of a non-locale route).
 */
export const getLocale = async (): Promise<LocaleCode | null> => {
  try {
    const value = await getIntlLocale()
    return isLocaleCode(value) ? value : null
  } catch {
    return null
  }
}

/**
 * Switch storefront locale: persist the choice on the Medusa cart (so emails
 * and notifications use the right language) and redirect the user to the
 * same path under the new locale prefix. Called from the language switcher.
 */
export const updateLocale = async (
  localeCode: LocaleCode,
  pathname: string = "/"
): Promise<void> => {
  const cartId = await getCartId()
  if (cartId) {
    const headers = { ...(await getAuthHeaders()) }
    // English is Medusa's unlocalized base content — clear the cart's
    // locale field so emails/notifications fall back to the backend
    // default rather than stamping `en-US`.
    const cartLocale =
      localeCode === DEFAULT_LOCALE ? null : localeToMedusa(localeCode)
    await sdk.store.cart.update(
      cartId,
      { locale: cartLocale },
      {},
      headers
    )
    const cartCacheTag = await getCacheTag("carts")
    if (cartCacheTag) revalidateTag(cartCacheTag)
  }

  const productsCacheTag = await getCacheTag("products")
  if (productsCacheTag) revalidateTag(productsCacheTag)

  const categoriesCacheTag = await getCacheTag("categories")
  if (categoriesCacheTag) revalidateTag(categoriesCacheTag)

  const collectionsCacheTag = await getCacheTag("collections")
  if (collectionsCacheTag) revalidateTag(collectionsCacheTag)

  redirect({ href: pathname, locale: localeCode })
}
