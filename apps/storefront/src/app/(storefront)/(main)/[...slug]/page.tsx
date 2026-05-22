import type { Metadata } from "next"
import { draftMode } from "next/headers"
import { cache } from "react"
import { getPayload } from "payload"
import configPromise from "@payload-config"

import type { Page } from "@/payload-types"
import { RenderHero } from "@/heros/RenderHero"
import { RenderBlocks } from "@/blocks/RenderBlocks"
import { LivePreviewListener } from "@/components/payload/LivePreviewListener"
import { PayloadRedirects } from "@/components/payload/PayloadRedirects"
import { generateMeta } from "@/utilities/generateMeta"

type Params = { slug?: string[] }

export async function generateStaticParams() {
  // Pages are rendered dynamically and revalidate on publish.
  return []
}

const queryPageByUrl = cache(async ({ url }: { url: string }): Promise<Page | null> => {
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: "pages",
    draft,
    limit: 1,
    pagination: false,
    overrideAccess: draft,
    where: {
      or: [
        { "breadcrumbs.url": { equals: url } },
        { slug: { equals: url.replace(/^\//, "") } },
      ],
    },
  })

  return (result.docs?.[0] as Page | undefined) ?? null
})

export default async function Page({ params }: { params: Promise<Params> }) {
  const { slug = [] } = await params
  const url = "/" + slug.map((s) => decodeURIComponent(s)).join("/")
  const { isEnabled: draft } = await draftMode()

  const page = await queryPageByUrl({ url })

  if (!page) {
    return <PayloadRedirects url={url} />
  }

  return (
    <article className="pb-24 pt-8">
      <PayloadRedirects disableNotFound url={url} />
      {draft ? <LivePreviewListener /> : null}
      <RenderHero {...page.hero} />
      <RenderBlocks blocks={page.layout} />
    </article>
  )
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug = [] } = await params
  const url = "/" + slug.map((s) => decodeURIComponent(s)).join("/")
  const page = await queryPageByUrl({ url })
  return generateMeta({ doc: page })
}
