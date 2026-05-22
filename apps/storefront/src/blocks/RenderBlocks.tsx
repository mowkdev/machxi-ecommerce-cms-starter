import { Fragment } from "react"

import type { LayoutBlock } from "./types"
import { CallToActionBlock } from "./CallToAction/Component"
import { ContentBlock } from "./Content/Component"
import { MediaBlock } from "./MediaBlock/Component"

const blockComponents = {
  cta: CallToActionBlock,
  content: ContentBlock,
  mediaBlock: MediaBlock,
} as const

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
        return (
          <div className="my-12 md:my-16" key={block.id ?? i}>
            {/* @ts-expect-error block prop shapes are discriminated by blockType */}
            <Component {...block} />
          </div>
        )
      })}
    </Fragment>
  )
}
