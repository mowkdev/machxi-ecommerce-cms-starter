import LocalizedLink from "@/modules/common/components/localized-link"
import Image from "next/image"
import { notFound } from "next/navigation"

import { getCollectionByHandle } from "@/lib/data/collections"
import { listProducts } from "@/lib/data/products"
import { getCheapestProductPrice } from "@/lib/prices"

export const dynamic = "force-dynamic"

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ countryCode: string; handle: string }>
}) {
  const { countryCode, handle } = await params

  const collection = await getCollectionByHandle(handle).catch(() => null)
  if (!collection) notFound()

  const { products, count } = await listProducts({
    countryCode,
    query: { collection_id: [collection.id], limit: 24 },
  }).catch(() => ({ products: [], count: 0 }))

  return (
    <main
      className="shop"
      data-screen-label={`Collection — ${collection.title}`}
    >
      <div className="crumb">
        <LocalizedLink href="/">Dabasberns</LocalizedLink>
        <span className="sep">/</span>
        <LocalizedLink href="/products">Shop</LocalizedLink>
        <span className="sep">/</span>
        <span className="now">{collection.title}</span>
      </div>

      <header className="shop-head">
        <div>
          <span className="eyebrow">
            {count} {count === 1 ? "product" : "products"}
          </span>
          <h1>{collection.title}</h1>
        </div>
      </header>

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
                    {p.type?.value ?? p.categories?.[0]?.name ?? ""}
                  </span>
                </LocalizedLink>
              )
            })}
          </div>

          {products.length === 0 && (
            <p
              style={{ color: "var(--ink-soft)", fontSize: 14, marginTop: 24 }}
            >
              Nothing in this collection yet.
            </p>
          )}
        </section>
      </div>
    </main>
  )
}
