import { defineRouting } from "next-intl/routing"

import { DEFAULT_LOCALE, LOCALE_CODES } from "./localization"

export const routing = defineRouting({
  locales: LOCALE_CODES,
  defaultLocale: DEFAULT_LOCALE,
  // Always include the locale in the URL so /products is never ambiguous
  // and the Medusa SDK header source is unambiguous.
  localePrefix: "always",
})
