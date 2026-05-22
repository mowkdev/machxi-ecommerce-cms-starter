import LocalizedLink from "@/modules/common/components/localized-link"
import Image from "next/image"
import { notFound } from "next/navigation"

import { getCategoryByHandle } from "@/lib/data/categories"
import { getCountryCode } from "@/lib/data/cookies"
import { listProducts } from "@/lib/data/products"
import { getCheapestProductPrice } from "@/lib/prices"

export const dynamic = "force-dynamic"

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string[] }>
}) {
  const { category } = await params

  const countryCode = await getCountryCode()
  if (!countryCode) notFound()

  const cat = await getCategoryByHandle(category).catch(() => null)
  if (!cat) notFound()

  const { products, count } = await listProducts({
    countryCode,
    query: { category_id: [cat.id], limit: 24 },
  }).catch(() => ({ products: [], count: 0 }))

  return (
    <main className="shop" data-screen-label={`Category — ${cat.name}`}>
      <div className="crumb">
        <LocalizedLink href="/">Dabasberns</LocalizedLink>
        <span className="sep">/</span>
        <LocalizedLink href="/products">Shop</LocalizedLink>
        {category.slice(0, -1).map((segment, i) => (
          <span key={i}>
            <span className="sep">/</span>
            <LocalizedLink
              href={`/categories/${category.slice(0, i + 1).join("/")}`}
            >
              {segment}
            </LocalizedLink>
          </span>
        ))}
        <span className="sep">/</span>
        <span className="now">{cat.name}</span>
      </div>

      <header className="shop-head">
        <div>
          <span className="eyebrow">
            {count} {count === 1 ? "product" : "products"}
          </span>
          <h1>{cat.name}</h1>
          {cat.description && (
            <p className="lede" style={{ marginTop: 12 }}>
              {cat.description}
            </p>
          )}
        </div>
      </header>

      {(cat.category_children?.length ?? 0) > 0 && (
        <nav
          style={{
            maxWidth: "var(--container)",
            margin: "0 auto",
            padding: "0 var(--pad) 24px",
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          {(cat.category_children ?? []).map((child) => (
            <LocalizedLink
              key={child.id}
              href={`/categories/${category.join("/")}/${child.handle}`}
              style={{
                display: "inline-block",
                padding: "10px 14px",
                borderRadius: 999,
                border:
                  "1px solid color-mix(in srgb, var(--ink) 18%, transparent)",
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--ink)",
                textDecoration: "none",
              }}
            >
              {child.name}
            </LocalizedLink>
          ))}
        </nav>
      )}

      <div className="cat-layout">
        <section className="results" style={{ gridColumn: "1 / -1" }}>
          <div className="pgrid">
            {products.map((p) => {
              const price = getCheapestProductPrice(p)
              return (
                <LocalizedLink
                  key={p.id}
                  className="product"
                  href={`/products/${p.handle}`}
                >
                  <div className="frame">
                    {p.thumbnail ? (
                      <Image
                        src={p.thumbnail}
                        alt={p.title}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="ph object-cover"
                      />
                    ) : (
                      <div className="ph" />
                    )}
                    <span className="ph-label">
                      {(p.subtitle ?? p.title ?? "").toUpperCase()}
                    </span>
                  </div>
                  <div className="meta">
                    <span className="name">{p.title}</span>
                    <span className="price">{price?.formatted ?? ""}</span>
                  </div>
                  <span className="cat">
                    {p.collection?.title ?? p.type?.value ?? ""}
                  </span>
                </LocalizedLink>
              )
            })}
          </div>

          {products.length === 0 && (
            <p
              style={{ color: "var(--ink-soft)", fontSize: 14, marginTop: 24 }}
            >
              Nothing in this category yet.
            </p>
          )}
        </section>
      </div>
    </main>
  )
}
