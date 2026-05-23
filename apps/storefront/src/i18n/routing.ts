import { defineRouting } from "next-intl/routing"

import { LOCALE_CODES, URL_DEFAULT_LOCALE } from "./localization"

export const routing = defineRouting({
  locales: LOCALE_CODES,
  defaultLocale: URL_DEFAULT_LOCALE,
  // Always include the locale in the URL so /products is never ambiguous
  // and the Medusa SDK header source is unambiguous.
  localePrefix: "always",
})
