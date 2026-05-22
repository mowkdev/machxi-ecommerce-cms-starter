import type { Page } from "@/payload-types"

export type LayoutBlock = NonNullable<Page["layout"]>[number]
export type CallToActionBlock = Extract<LayoutBlock, { blockType: "cta" }>
export type ContentBlock = Extract<LayoutBlock, { blockType: "content" }>
export type MediaBlock = Extract<LayoutBlock, { blockType: "mediaBlock" }>
export type CreatorBlock = Extract<LayoutBlock, { blockType: "creator" }>
export type ShopCtaBlock = Extract<LayoutBlock, { blockType: "shopCta" }>
