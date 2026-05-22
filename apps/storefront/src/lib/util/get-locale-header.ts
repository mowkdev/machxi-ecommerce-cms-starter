import { getLocale } from "@/lib/data/locale-actions"
import { DEFAULT_LOCALE, localeToMedusa } from "@/i18n/localization"

export async function getLocaleHeader() {
  const locale = (await getLocale()) ?? DEFAULT_LOCALE
  return {
    "x-medusa-locale": localeToMedusa(locale),
  } as const
}
