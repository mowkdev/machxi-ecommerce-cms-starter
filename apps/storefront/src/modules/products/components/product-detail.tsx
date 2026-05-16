"use client"

import Image from "next/image"
import { useState, useMemo } from "react"
import { HttpTypes } from "@medusajs/types"

import { cn } from "@/lib/utils"
import { useCart } from "@/modules/cart/components/cart-provider"
import { useCartUi } from "@/modules/cart/components/cart-panel"
import { getVariantPrice, formatPrice } from "@/lib/prices"
import { PayloadRichText } from "@/components/payload/RichText"
import type { StoreProductWithPayload } from "@/types/global"

export function ProductDetail({
  product,
}: {
  product: HttpTypes.StoreProduct
}) {
  const payloadProduct = (product as StoreProductWithPayload).payload_product
  const { addItem, adding } = useCart()
  const { open: openCart } = useCartUi()

  const options = product.options ?? []
  const variants = product.variants ?? []
  const images = product.images ?? []

  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >(() => {
    const initial: Record<string, string> = {}
    for (const opt of options) {
      if (opt.values?.[0]) {
        initial[opt.id] = opt.values[0].value
      }
    }
    return initial
  })

  const [qty, setQty] = useState(1)
  const [activeImageIdx, setActiveImageIdx] = useState(0)

  const selectedVariant = useMemo(() => {
    if (variants.length === 1) return variants[0]

    return (
      variants.find((v) =>
        (v.options ?? []).every(
          (vo: HttpTypes.StoreProductOptionValue) =>
            selectedOptions[vo.option_id!] === vo.value
        )
      ) ?? variants[0]
    )
  }, [variants, selectedOptions])

  const variantPrice = selectedVariant ? getVariantPrice(selectedVariant) : null

  const displayTitle = payloadProduct?.title ?? product.title ?? ""
  const titleParts = displayTitle.split(" ")
  const titleLine1 = titleParts[0] ?? ""
  const titleLine2 = titleParts.slice(1).join(" ") || undefined

  // Galleries always come from Medusa now — Payload no longer owns images.
  const displayImages: { url: string }[] = images
  const displayThumbnail = payloadProduct?.thumbnail ?? product.thumbnail ?? null

  const activeImageUrl =
    displayImages[activeImageIdx]?.url ?? displayThumbnail ?? null

  async function handleAddToCart() {
    if (!selectedVariant) return
    await addItem(selectedVariant.id, qty)
    openCart()
  }

  const totalFormatted = variantPrice
    ? formatPrice(
        variantPrice.calculated_amount * qty,
        variantPrice.currency_code
      )
    : ""

  const metaRecord = product.metadata as Record<string, any> | null

  return (
    <div className="pdp-main">
      {/* GALLERY */}
      <div className="gallery">
        <div className="hero-img">
          {activeImageUrl ? (
            <Image
              src={activeImageUrl}
              alt={displayTitle}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          ) : (
            <div className="ph" />
          )}
          <span className="corner">{metaRecord?.gallery_corner ?? ""}</span>
          <span className="ph-label">
            {displayTitle.toUpperCase()}
          </span>
        </div>
        {displayImages.length > 1 && (
          <div className="thumbs">
            {displayImages.map((img, i) => (
              <button
                key={i}
                type="button"
                className={cn("thumb", activeImageIdx === i && "on")}
                aria-label={`View ${i + 1}`}
                onClick={() => setActiveImageIdx(i)}
              >
                <Image
                  src={img.url}
                  alt={`${displayTitle} view ${i + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
                <span className="lbl">
                  {i === 0 ? "Full" : `View ${i + 1}`}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* DETAIL */}
      <div className="detail">
        <span className="eyebrow">
          {(product.subtitle ?? product.collection?.title ?? "").toUpperCase()}
        </span>
        <h1>
          {titleLine1}
          {titleLine2 && (
            <>
              <br />
              {titleLine2}
            </>
          )}
        </h1>
        <span className="sku">SKU · {selectedVariant?.sku ?? product.id ?? ""}</span>

        <div className="price-row">
          <span className="price">{variantPrice?.formatted ?? ""}</span>
          <span className="ship">
            <span className="dot" />
            {metaRecord?.ship_note ?? "Check availability"}
          </span>
        </div>

        <PayloadRichText
          data={payloadProduct?.description ?? null}
          fallback={product.description}
          className="lede"
        />

        {/* Product options */}
        {options.map((opt) => (
          <div className="opt" key={opt.id}>
            <div className="head">
              <span className="lbl">{opt.title}</span>
              <span className="val">{selectedOptions[opt.id] ?? ""}</span>
            </div>
            <div className="opt-row">
              {(opt.values ?? []).map((v) => (
                <button
                  key={v.id}
                  type="button"
                  className={cn(
                    "pick",
                    selectedOptions[opt.id] === v.value && "on"
                  )}
                  onClick={() =>
                    setSelectedOptions((prev) => ({
                      ...prev,
                      [opt.id]: v.value,
                    }))
                  }
                >
                  {v.value}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* BUY */}
        <div className="buy">
          <div className="qty">
            <button
              type="button"
              aria-label="Decrease"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
            >
              −
            </button>
            <span className="val">{qty}</span>
            <button
              type="button"
              aria-label="Increase"
              onClick={() => setQty((q) => Math.min(9, q + 1))}
            >
              +
            </button>
          </div>
          <button
            className="add"
            type="button"
            onClick={handleAddToCart}
            disabled={adding || !selectedVariant}
          >
            <span>{adding ? "Adding…" : "Add to bench"}</span>
            <span className="price-mini">{totalFormatted}</span>
          </button>
        </div>

        {metaRecord?.bench_note && (
          <div className="bench-note">
            <span className="mark">From the bench</span>
            <div>{metaRecord.bench_note}</div>
          </div>
        )}
      </div>
    </div>
  )
}
