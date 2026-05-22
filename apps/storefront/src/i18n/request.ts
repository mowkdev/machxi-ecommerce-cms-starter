import { getRequestConfig } from "next-intl/server"
import { hasLocale } from "next-intl"

import { DEFAULT_LOCALE } from "./localization"
import { routing } from "./routing"

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : DEFAULT_LOCALE

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  }
})
