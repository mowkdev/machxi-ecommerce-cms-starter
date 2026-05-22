import LocalizedLink from "@/modules/common/components/localized-link"
import Image from "next/image"
import { redirect, notFound } from "next/navigation"

import { Pager } from "@/modules/shop/components/pager"
import { ShopSidebar } from "@/modules/shop/components/shop-sidebar"
import { SortDropdown } from "@/modules/shop/components/sort-dropdown"
import { listCategories } from "@/lib/data/categories"
import { listProducts } from "@/lib/data/products"
import { getCheapestProductPrice } from "@/lib/prices"
import {
  PRODUCTS_PER_PAGE,
  buildShopHref,
  orderForSort,
  parseSort,
} from "@/lib/shop-sort"
import type { StoreProductWithPayload } from "@/types/global"

// Cap on rows we'll fetch when client-side-sorting by price.
// Medusa can't ORDER BY `variants.calculated_price` (it's a derived field),
// so we fetch a batch, sort in JS, and slice. Acceptable for small catalogs.
const PRICE_SORT_FETCH_CAP = 200

function pad(n: number) {
  return String(n).padStart(2, "0")
}

export async function ShopTemplate({
  countryCode,
  handle,
  page,
  rawSort,
}: {
  countryCode: string
  handle: string
  page: number
  rawSort: string | string[] | undefined
}) {
  if (page < 1) notFound()

  const sort = parseSort(rawSort)

  // Categories drive the sidebar nav.
  const categories = await listCategories().catch(() => [])
  const activeCategory =
    handle === "all" ? null : categories.find((c) => c.handle === handle)

  if (handle !== "all" && !activeCategory) {
    notFound()
  }

  const categoryFilter = activeCategory
    ? { category_id: [activeCategory.id] }
    : {}

  const isPriceSort = sort === "price_asc" || sort === "price_desc"

  let products: Awaited<ReturnType<typeof listProducts>>["products"] = []
  let count = 0

  if (!isPriceSort) {
    // Native server-side pagination + ordering.
    const { products: pageProducts, count: total } = await listProducts({
      countryCode,
      query: {
        ...categoryFilter,
        limit: PRODUCTS_PER_PAGE,
        offset: (page - 1) * PRODUCTS_PER_PAGE,
        order: orderForSort(sort),
      },
    }).catch(() => ({ products: [], count: 0 }))
    products = pageProducts
    count = total
  } else {
    // Medusa can't ORDER BY `variants.calculated_price`. Fetch up to a cap,
    // sort by cheapest variant price in JS, then slice the page.
    const { products: all, count: total } = await listProducts({
      countryCode,
      query: {
        ...categoryFilter,
        limit: PRICE_SORT_FETCH_CAP,
        offset: 0,
        order: "-created_at",
      },
    }).catch(() => ({ products: [], count: 0 }))

    const sorted = [...all].sort((a, b) => {
      const ap = getCheapestProductPrice(a)?.calculated_amount ?? Infinity
      const bp = getCheapestProductPrice(b)?.calculated_amount ?? Infinity
      return sort === "price_asc" ? ap - bp : bp - ap
    })

    const start = (page - 1) * PRODUCTS_PER_PAGE
    products = sorted.slice(start, start + PRODUCTS_PER_PAGE)
    // Cap the visible total to what we actually fetched, so the pager
    // doesn't promise pages we can't reach in price-sort mode.
    count = Math.min(total, sorted.length)
  }

  const totalPages = Math.max(1, Math.ceil(count / PRODUCTS_PER_PAGE))

  // Out-of-range page: redirect to canonical page 1 instead of 404'ing.
  if (page > totalPages && count > 0) {
    redirect(buildShopHref({ handle, sort }))
  }

  const title = activeCategory?.name ?? "All products"
  const heading = activeCategory ? activeCategory.name : "Shop"
  const description = activeCategory?.description ?? null

  const start = count === 0 ? 0 : (page - 1) * PRODUCTS_PER_PAGE + 1
  const end = Math.min(count, page * PRODUCTS_PER_PAGE)

  return (
    <main className="shop" data-screen-label={`Shop — ${title}`}>
      <div className="crumb">
        <LocalizedLink href="/">Dabasberns</LocalizedLink>
        <span className="sep">/</span>
        <LocalizedLink href="/shop">Shop</LocalizedLink>
        {activeCategory && (
          <>
            <span className="sep">/</span>
            <span className="now">{activeCategory.name}</span>
          </>
        )}
        {!activeCategory && (
          <>
            <span className="sep">/</span>
            <span className="now">All</span>
          </>
        )}
      </div>

      <header className="shop-head">
        <div>
          <span className="eyebrow">
            {count} {count === 1 ? "product" : "products"}
          </span>
          <h1>{heading}</h1>
        </div>
        {description && <p className="lede">{description}</p>}
      </header>

      <div className="cat-layout">
        <ShopSidebar
          categories={categories}
          activeHandle={handle}
          totalCount={count}
        />

        <section className="results">
          <div className="results-bar">
            <div className="count">
              {count === 0 ? (
                "No products"
              ) : (
                <>
                  Showing{" "}
                  <strong>
                    {pad(start)}–{pad(end)}
                  </strong>{" "}
                  of {count}
                </>
              )}
            </div>
            <div className="controls">
              <SortDropdown value={sort} />
            </div>
          </div>

          <div className="pgrid">
            {products.map((p) => {
              const pPayload = (p as StoreProductWithPayload).payload_product
              const pTitle = pPayload?.title ?? p.title ?? ""
              const pThumbnail = pPayload?.thumbnail ?? p.thumbnail ?? null
              const price = getCheapestProductPrice(p)
              return (
                <LocalizedLink
                  key={p.id}
                  className="product"
                  href={`/products/${p.handle}`}
                >
                  <div className="frame">
                    {pThumbnail ? (
                      <Image
                        src={pThumbnail}
                        alt={pTitle}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="ph object-cover"
                      />
                    ) : (
                      <div className="ph" />
                    )}
                    <span className="ph-label">
                      {(p.subtitle ?? pTitle).toUpperCase()}
                    </span>
                  </div>
                  <div className="meta">
                    <span className="name">{pTitle}</span>
                    <span className="price">{price?.formatted ?? ""}</span>
                  </div>
                  <span className="cat">
                    {p.collection?.title ??
                      p.type?.value ??
                      p.categories?.[0]?.name ??
                      ""}
                  </span>
                </LocalizedLink>
              )
            })}
          </div>

          {products.length === 0 && count === 0 && (
            <p
              style={{
                color: "var(--ink-soft)",
                fontSize: 14,
                marginTop: 24,
                textAlign: "center",
              }}
            >
              Nothing here yet. Check back soon.
            </p>
          )}

          <Pager
            handle={handle}
            currentPage={page}
            totalPages={totalPages}
            sort={sort}
          />
        </section>
      </div>
    </main>
  )
}
