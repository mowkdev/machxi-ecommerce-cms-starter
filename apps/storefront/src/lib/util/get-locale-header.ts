import { getLocale } from "@/lib/data/locale-actions"
import {
  DEFAULT_LOCALE,
  URL_DEFAULT_LOCALE,
  localeToMedusa,
} from "@/i18n/localization"

// Medusa has no concept of a default content language: English products
// are stored WITHOUT a locale, and translations are added against a locale
// code. So the storefront must omit `x-medusa-locale` entirely when the
// active locale is the content default (English) — sending `en-US` would
// make Medusa look up a translation that doesn't exist.
export async function getLocaleHeader(): Promise<Record<string, string>> {
  const locale = (await getLocale()) ?? URL_DEFAULT_LOCALE
  if (locale === DEFAULT_LOCALE) return {}
  return { "x-medusa-locale": localeToMedusa(locale) }
}
