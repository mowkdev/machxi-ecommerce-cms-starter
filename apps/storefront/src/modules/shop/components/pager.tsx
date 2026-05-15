import LocalizedLink from "@/modules/common/components/localized-link"

import { cn } from "@/lib/utils"
import { buildShopHref, type SortKey } from "@/lib/shop-sort"

function pad(n: number) {
  return String(n).padStart(2, "0")
}

/**
 * Builds a compact pagination window with leading/trailing edges and an
 * ellipsis marker on either side when the total page count is large.
 */
function pageWindow(current: number, total: number): (number | "…")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const set = new Set<number>([1, total, current - 1, current, current + 1])
  const sorted = [...set]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b)
  const out: (number | "…")[] = []
  for (let i = 0; i < sorted.length; i++) {
    out.push(sorted[i])
    if (i < sorted.length - 1 && sorted[i + 1] - sorted[i] > 1) {
      out.push("…")
    }
  }
  return out
}

export function Pager({
  countryCode,
  handle,
  currentPage,
  totalPages,
  sort,
}: {
  countryCode: string
  handle: string
  currentPage: number
  totalPages: number
  sort: SortKey
}) {
  if (totalPages <= 1) return null

  const prev = currentPage > 1 ? currentPage - 1 : null
  const next = currentPage < totalPages ? currentPage + 1 : null
  const window = pageWindow(currentPage, totalPages)

  const hrefFor = (page: number) =>
    buildShopHref({ countryCode, handle, page, sort })

  return (
    <nav className="pager" aria-label="Pagination">
      {prev ? (
        <LocalizedLink
          className="nav-btn"
          aria-label="Previous page"
          href={hrefFor(prev).replace(`/${countryCode}`, "")}
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path d="M10 3L5 8l5 5" />
          </svg>
        </LocalizedLink>
      ) : (
        <button
          type="button"
          className="nav-btn"
          disabled
          aria-label="Previous page"
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path d="M10 3L5 8l5 5" />
          </svg>
        </button>
      )}

      {window.map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="gap" aria-hidden>
            …
          </span>
        ) : (
          <LocalizedLink
            key={p}
            href={hrefFor(p).replace(`/${countryCode}`, "")}
            className={cn(p === currentPage && "now")}
            aria-current={p === currentPage ? "page" : undefined}
          >
            {pad(p)}
          </LocalizedLink>
        )
      )}

      {next ? (
        <LocalizedLink
          className="nav-btn"
          aria-label="Next page"
          href={hrefFor(next).replace(`/${countryCode}`, "")}
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path d="M6 3l5 5-5 5" />
          </svg>
        </LocalizedLink>
      ) : (
        <button
          type="button"
          className="nav-btn"
          disabled
          aria-label="Next page"
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path d="M6 3l5 5-5 5" />
          </svg>
        </button>
      )}
    </nav>
  )
}
