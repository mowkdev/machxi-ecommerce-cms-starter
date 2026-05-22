export const LOCALES = [
  { code: "en", medusaCode: "en-US", label: "English" },
  { code: "lv", medusaCode: "lv-LV", label: "Latviešu" },
] as const

export const DEFAULT_LOCALE = "en"

export type LocaleCode = (typeof LOCALES)[number]["code"]

export const LOCALE_CODES = LOCALES.map((l) => l.code) as readonly LocaleCode[]

export const isLocaleCode = (value: string | undefined | null): value is LocaleCode =>
  !!value && (LOCALE_CODES as readonly string[]).includes(value)

// Storefront URLs use the bare language code (`/en`, `/lv`). Medusa expects
// BCP47 (`en-US`, `lv-LV`) on `x-medusa-locale`. Map at the SDK boundary.
export const localeToMedusa = (code: LocaleCode): string =>
  LOCALES.find((l) => l.code === code)!.medusaCode
