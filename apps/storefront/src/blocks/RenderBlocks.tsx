import { Fragment } from "react"

import type { LayoutBlock } from "./types"
import { CallToActionBlock } from "./CallToAction/Component"
import { ContentBlock } from "./Content/Component"
import { CreatorBlock } from "./Creator/Component"
import { MediaBlock } from "./MediaBlock/Component"
import { ShopCtaBlock } from "./ShopCta/Component"

const blockComponents = {
  cta: CallToActionBlock,
  content: ContentBlock,
  mediaBlock: MediaBlock,
  creator: CreatorBlock,
  shopCta: ShopCtaBlock,
} as const

const fullBleedBlocks = new Set(["creator", "shopCta"])

type Props = {
  blocks?: LayoutBlock[] | null
}

export function RenderBlocks({ blocks }: Props) {
  if (!blocks?.length) return null

  return (
    <Fragment>
      {blocks.map((block, i) => {
        const Component = blockComponents[block.blockType]
        if (!Component) return null
        const key = block.id ?? i
        if (fullBleedBlocks.has(block.blockType)) {
          // @ts-expect-error block prop shapes are discriminated by blockType
          return <Component key={key} {...block} />
        }
        return (
          <div className="my-12 md:my-16" key={key}>
            {/* @ts-expect-error block prop shapes are discriminated by blockType */}
            <Component {...block} />
          </div>
        )
      })}
    </Fragment>
  )
}
