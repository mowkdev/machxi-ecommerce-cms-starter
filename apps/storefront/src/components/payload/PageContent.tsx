import { draftMode } from "next/headers"

import type { Page } from "@/payload-types"
import { RenderHero } from "@/heros/RenderHero"
import { RenderBlocks } from "@/blocks/RenderBlocks"
import { LivePreviewListener } from "@/components/payload/LivePreviewListener"
import { PayloadRedirects } from "@/components/payload/PayloadRedirects"

type Props = {
  page: Page
  url?: string
}

export async function PageContent({ page, url }: Props) {
  const { isEnabled: draft } = await draftMode()
  const isFullBleedHero = page.hero?.type === "parallax"

  return (
    <article className={isFullBleedHero ? undefined : "pb-24 pt-8"}>
      {url ? <PayloadRedirects disableNotFound url={url} /> : null}
      {draft ? <LivePreviewListener /> : null}
      <RenderHero {...page.hero} />
      <RenderBlocks blocks={page.layout} />
    </article>
  )
}
