/**
 * Shop sorting + pagination configuration.
 *
 * Sort options follow the Medusa starter convention:
 *   - "latest" (default) — newest first
 *   - "price_asc" — cheapest first
 *   - "price_desc" — most expensive first
 *
 * URL contract: the default sort is implicit (no `?sort=` param).
 * Non-default sorts surface as `?sort=price_asc` etc.
 */

export type SortKey = "latest" | "price_asc" | "price_desc"

export const DEFAULT_SORT: SortKey = "latest"

export const SORT_OPTIONS: { key: SortKey; label: string; order: string }[] = [
  { key: "latest", label: "Latest", order: "-created_at" },
  {
    key: "price_asc",
    label: "Price · low to high",
    order: "variants.calculated_price",
  },
  {
    key: "price_desc",
    label: "Price · high to low",
    order: "-variants.calculated_price",
  },
]

export const PRODUCTS_PER_PAGE = 12

export function parseSort(raw: string | string[] | undefined): SortKey {
  const value = Array.isArray(raw) ? raw[0] : raw
  if (value && SORT_OPTIONS.some((o) => o.key === value)) {
    return value as SortKey
  }
  return DEFAULT_SORT
}

export function orderForSort(sort: SortKey): string {
  return (
    SORT_OPTIONS.find((o) => o.key === sort)?.order ?? SORT_OPTIONS[0].order
  )
}

/**
 * Build a /shop URL from its parts. The default sort is dropped from the
 * query string; page=1 is dropped from the path.
 */
export function buildShopHref({
  countryCode,
  handle,
  page = 1,
  sort,
}: {
  countryCode: string
  handle: string
  page?: number
  sort?: SortKey
}): string {
  const safePage = Math.max(1, page)
  const path =
    safePage === 1
      ? `/${countryCode}/shop/${handle}`
      : `/${countryCode}/shop/${handle}/page/${safePage}`
  const q =
    sort && sort !== DEFAULT_SORT ? `?sort=${encodeURIComponent(sort)}` : ""
  return `${path}${q}`
}
