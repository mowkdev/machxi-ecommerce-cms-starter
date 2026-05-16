"use client"

import LocalizedLink from "@/modules/common/components/localized-link"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { HttpTypes } from "@medusajs/types"

import { Button } from "@/modules/common/ui/button"
import { cn } from "@/lib/utils"
import { getCheapestProductPrice } from "@/lib/prices"
import type { StoreProductWithPayload } from "@/types/global"

export function FeaturedProducts({
  products,
}: {
  products: HttpTypes.StoreProduct[]
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const [idx, setIdx] = useState(0)
  const [maxIdx, setMaxIdx] = useState(0)
  const [step, setStep] = useState(0)

  const measure = useCallback(() => {
    const track = trackRef.current
    const viewport = viewportRef.current
    if (!track || !viewport) return
    const first = track.children[0] as HTMLElement | undefined
    if (!first) return
    const styles = getComputedStyle(track)
    const gap = parseFloat(styles.columnGap || styles.gap || "0")
    const cardW = first.getBoundingClientRect().width
    const viewportW = viewport.getBoundingClientRect().width
    const visible = Math.max(1, Math.floor((viewportW + gap) / (cardW + gap)))
    setStep(cardW + gap)
    setMaxIdx(Math.max(0, track.children.length - visible))
  }, [])

  useEffect(() => {
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [measure])

  useEffect(() => {
    if (idx > maxIdx) setIdx(maxIdx)
  }, [maxIdx, idx])

  const prev = () => setIdx((i) => Math.max(0, i - 1))
  const next = () => setIdx((i) => Math.min(maxIdx, i + 1))

  if (!products.length) return null

  return (
    <section
      data-screen-label="Featured products"
      className="relative z-[2] bg-paper pt-[120px] pb-[90px]"
    >
      <div className="container-padded flex items-end justify-between gap-6 mb-14">
        <div>
          <span className="inline-flex items-center gap-3 text-[12px] tracking-[0.32em] uppercase text-[var(--accent-deep)] before:content-[''] before:w-6 before:h-px before:bg-current">
            Six things, picked
          </span>
          <h2
            className="font-display font-normal uppercase mt-3 mb-0 leading-[1.05]"
            style={{
              fontSize: "clamp(32px, 4vw, 52px)",
              letterSpacing: "0.04em",
            }}
          >
            The shelf, this week.
          </h2>
        </div>
        <div className="flex gap-2.5 items-center">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Previous"
            onClick={prev}
            disabled={idx <= 0}
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Next"
            onClick={next}
            disabled={idx >= maxIdx}
          >
            <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
          </Button>
        </div>
      </div>

      <div className="container-padded overflow-hidden" ref={viewportRef}>
        <div
          ref={trackRef}
          className="flex gap-7 will-change-transform transition-transform duration-500"
          style={{
            transform: `translateX(${-(idx * step)}px)`,
            transitionTimingFunction: "cubic-bezier(0.22, 0.9, 0.28, 1)",
          }}
        >
          {products.map((p) => {
            const payloadProduct = (p as StoreProductWithPayload).payload_product
            const displayTitle = payloadProduct?.title ?? p.title ?? ""
            const displayThumbnail = payloadProduct?.thumbnail ?? p.thumbnail ?? null
            const price = getCheapestProductPrice(p)
            const tag = (p.metadata as Record<string, string> | null)?.tag
            const tagVariant = (p.metadata as Record<string, string> | null)
              ?.tag_variant

            return (
              <LocalizedLink
                key={p.id}
                href={`/products/${p.handle}`}
                className="group no-underline text-inherit flex flex-col gap-3.5 cursor-pointer shrink-0 basis-[78%] min-w-[260px] sm:basis-[calc((100%-28px)/2)] lg:basis-[calc((100%-28px*2)/3)] xl:basis-[calc((100%-28px*3)/4)]"
              >
                <div
                  className="relative aspect-[3/4] rounded-md overflow-hidden flex items-center justify-center transition-transform duration-300 ease-out group-hover:-translate-y-1"
                  style={{ background: "var(--paper-2)" }}
                >
                  {displayThumbnail ? (
                    <Image
                      src={displayThumbnail}
                      alt={displayTitle}
                      fill
                      sizes="(max-width: 640px) 78vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover"
                    />
                  ) : (
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `repeating-linear-gradient(135deg, color-mix(in srgb, var(--ink) 4%, transparent) 0 8px, transparent 8px 16px), linear-gradient(to bottom, var(--paper-2), var(--paper-3))`,
                      }}
                    />
                  )}
                  {tag && (
                    <span
                      className={cn(
                        "absolute top-3.5 left-3.5 text-[10px] tracking-[0.18em] uppercase py-1.5 px-2.5 rounded-full z-10",
                        tagVariant === "accent"
                          ? "bg-accent text-paper"
                          : "bg-ink text-paper"
                      )}
                    >
                      {tag}
                    </span>
                  )}
                  <span
                    className="absolute bottom-3.5 left-3.5 text-[11px] tracking-[0.08em] uppercase font-mono z-10"
                    style={{
                      color: displayThumbnail
                        ? "rgba(255,255,255,0.8)"
                        : "color-mix(in srgb, var(--ink) 55%, transparent)",
                    }}
                  >
                    {(p.subtitle ?? displayTitle).toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between items-baseline gap-3">
                  <span className="font-display font-normal text-[18px] tracking-[0.04em] uppercase">
                    {displayTitle}
                  </span>
                  <span className="text-[15px] font-medium tabular-nums">
                    {price?.formatted ?? ""}
                  </span>
                </div>
                <span className="-mt-1.5 text-[12px] tracking-[0.14em] uppercase text-ink-soft">
                  {p.collection?.title ??
                    p.type?.value ??
                    p.categories?.[0]?.name ??
                    ""}
                </span>
              </LocalizedLink>
            )
          })}
        </div>
      </div>
    </section>
  )
}
