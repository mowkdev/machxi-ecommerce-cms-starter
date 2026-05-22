import LocalizedLink from "@/modules/common/components/localized-link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"

import { ProductDetail } from "@/modules/products/components/product-detail"
import { getCountryCode } from "@/lib/data/cookies"
import { getProductByHandle, listProducts } from "@/lib/data/products"
import { getCheapestProductPrice } from "@/lib/prices"
import type { StoreProductWithPayload } from "@/types/global"

async function getRelatedProducts(
  currentId: string,
  countryCode: string
): Promise<HttpTypes.StoreProduct[]> {
  try {
    const { products } = await listProducts({
      countryCode,
      query: { limit: 5 },
    })
    return products.filter((p) => p.id !== currentId).slice(0, 4)
  } catch {
    return []
  }
}

export const dynamic = "force-dynamic"

export default async function ProductPage({
  params,
}: {
  params: Promise<{ handle: string }>
}) {
  const { handle } = await params

  const countryCode = await getCountryCode()
  if (!countryCode) return notFound()

  let product: HttpTypes.StoreProduct | null = null
  try {
    product = await getProductByHandle(handle, countryCode)
  } catch {
    // Medusa backend unavailable
  }
  if (!product) return notFound()

  const related = await getRelatedProducts(product.id, countryCode)
  const metaRecord = product.metadata as Record<string, any> | null
  const specs: { k: string; v: string; small: string }[] =
    metaRecord?.specs ?? []

  const payloadProduct = (product as StoreProductWithPayload).payload_product
  const seoTitle = payloadProduct?.seo?.title ?? product.title
  const seoDescription = payloadProduct?.seo?.description ?? product.description
  // Galleries always come from Medusa now — Payload no longer owns images.
  const displayImages = (product.images ?? []).map((i) => i.url).filter(Boolean) as string[]
  const displayThumbnail = payloadProduct?.thumbnail ?? product.thumbnail ?? null

  const price = getCheapestProductPrice(product)
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "https://dabasberns.lv"
  const productLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: seoTitle,
    description: seoDescription ?? product.subtitle ?? undefined,
    image: displayImages,
    sku: product.variants?.[0]?.sku ?? product.id,
    brand: { "@type": "Brand", name: "Dabasberns" },
    offers: price
      ? {
          "@type": "Offer",
          url: `${siteUrl}/products/${product.handle}`,
          priceCurrency: price.currency_code?.toUpperCase(),
          price: price.calculated_amount,
          availability: (product.variants ?? []).some(
            (v) => (v.inventory_quantity ?? 0) > 0
          )
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
        }
      : undefined,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />
      <main className="shop" data-screen-label={`Product — ${seoTitle}`}>
        <div className="crumb">
          <LocalizedLink href="/">Dabasberns</LocalizedLink>
          <span className="sep">/</span>
          <LocalizedLink href="/products">Products</LocalizedLink>
          <span className="sep">/</span>
          <span className="now">{seoTitle}</span>
        </div>

        <div className="pdp">
          <ProductDetail product={product} />

          {specs.length > 0 && (
            <section className="specs-section">
              <div className="specs-head">
                <h3>The bench card</h3>
                <p>
                  Every rod that leaves the workshop ships with a hand-written
                  bench card — the same numbers we pencil in while we tune the
                  blank. These are the ones we&apos;ve kept on this rod.
                </p>
              </div>
              <div className="specs">
                {specs.map((s) => (
                  <div key={s.k}>
                    <div className="k">{s.k}</div>
                    <div className="v">
                      {s.v}
                      <small>{s.small}</small>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {related.length > 0 && (
            <section className="pairs">
              <h3>Pairs nicely with</h3>
              <div className="row">
                {related.map((p) => {
                  const rPayload = (p as StoreProductWithPayload).payload_product
                  const rTitle = rPayload?.title ?? p.title ?? ""
                  const rThumbnail = rPayload?.thumbnail ?? p.thumbnail ?? null
                  const price = getCheapestProductPrice(p)
                  return (
                    <LocalizedLink
                      key={p.id}
                      className="product"
                      href={`/products/${p.handle}`}
                    >
                      <div className="frame">
                        {rThumbnail ? (
                          <Image
                            src={rThumbnail}
                            alt={rTitle}
                            fill
                            sizes="(max-width: 640px) 50vw, 25vw"
                            className="object-cover"
                          />
                        ) : (
                          <div className="ph" />
                        )}
                        <span className="ph-label">
                          {(p.subtitle ?? rTitle).toUpperCase()}
                        </span>
                      </div>
                      <div className="meta">
                        <span className="name">{rTitle}</span>
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
            </section>
          )}
        </div>
      </main>
    </>
  )
}
