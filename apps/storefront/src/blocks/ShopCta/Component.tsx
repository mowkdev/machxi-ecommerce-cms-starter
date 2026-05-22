import type { Media } from "@/payload-types"
import {
  ShopCta as ShopCtaView,
  type ShopCtaImage,
} from "@/modules/home/components/shop-cta"

import type { ShopCtaBlock as ShopCtaBlockProps } from "../types"

type MediaRef = (number | null) | Media | undefined

function mediaUrl(ref: MediaRef): string | undefined {
  if (ref && typeof ref === "object" && "url" in ref && ref.url) return ref.url
  return undefined
}

function nullToUndef<T>(value: T | null | undefined): T | undefined {
  return value ?? undefined
}

function toShopCtaImage(
  entry?: {
    media?: MediaRef
    alt?: string | null
    captionLeft?: string | null
    captionRight?: string | null
  } | null,
): ShopCtaImage | undefined {
  if (!entry) return undefined
  return {
    src: mediaUrl(entry.media),
    alt: nullToUndef(entry.alt),
    captionLeft: nullToUndef(entry.captionLeft),
    captionRight: nullToUndef(entry.captionRight),
  }
}

export function ShopCtaBlock({
  eyebrow,
  headlinePrefix,
  headlineAccent,
  headlineSuffix,
  paragraphs,
  ctaLabel,
  ctaHref,
  stamp,
  stats,
  images,
}: ShopCtaBlockProps) {
  const paragraphsProp = (paragraphs ?? []).map((p) => p.text)
  const statsProp = (stats ?? []).map((s) => ({ value: s.value, label: s.label }))
  const imagesProp: [ShopCtaImage?, ShopCtaImage?, ShopCtaImage?] = [
    toShopCtaImage(images?.[0]),
    toShopCtaImage(images?.[1]),
    toShopCtaImage(images?.[2]),
  ]

  const stampProp =
    stamp && (stamp.line1 || stamp.line2 || stamp.small)
      ? {
          line1: nullToUndef(stamp.line1),
          line2: nullToUndef(stamp.line2),
          small: nullToUndef(stamp.small),
        }
      : undefined

  return (
    <ShopCtaView
      eyebrow={nullToUndef(eyebrow)}
      headlinePrefix={nullToUndef(headlinePrefix)}
      headlineAccent={nullToUndef(headlineAccent)}
      headlineSuffix={nullToUndef(headlineSuffix)}
      paragraphs={paragraphsProp}
      ctaLabel={ctaLabel}
      ctaHref={ctaHref}
      stamp={stampProp}
      stats={statsProp}
      images={imagesProp}
    />
  )
}
