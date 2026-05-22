import type { Metadata } from "next"
import { draftMode } from "next/headers"
import { cache } from "react"
import { getPayload, type TypedLocale } from "payload"
import configPromise from "@payload-config"

import type { Page } from "@/payload-types"
import { RenderHero } from "@/heros/RenderHero"
import { RenderBlocks } from "@/blocks/RenderBlocks"
import { LivePreviewListener } from "@/components/payload/LivePreviewListener"
import { PayloadRedirects } from "@/components/payload/PayloadRedirects"
import { generateMeta } from "@/utilities/generateMeta"

type Params = { slug?: string[]; locale: string }

export async function generateStaticParams() {
  // Pages are rendered dynamically and revalidate on publish.
  return []
}

const queryPageByUrl = cache(
  async ({
    url,
    locale,
  }: {
    url: string
    locale: TypedLocale
  }): Promise<Page | null> => {
    const { isEnabled: draft } = await draftMode()
    const payload = await getPayload({ config: configPromise })

    const result = await payload.find({
      collection: "pages",
      draft,
      limit: 1,
      pagination: false,
      overrideAccess: draft,
      locale,
      where: {
        or: [
          { "breadcrumbs.url": { equals: url } },
          { slug: { equals: url.replace(/^\//, "") } },
        ],
      },
    })

    return (result.docs?.[0] as Page | undefined) ?? null
  }
)

export default async function Page({ params }: { params: Promise<Params> }) {
  const { slug = [], locale } = await params
  const url = "/" + slug.map((s) => decodeURIComponent(s)).join("/")
  const { isEnabled: draft } = await draftMode()

  const page = await queryPageByUrl({ url, locale: locale as TypedLocale })

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

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { slug = [], locale } = await params
  const url = "/" + slug.map((s) => decodeURIComponent(s)).join("/")
  const page = await queryPageByUrl({ url, locale: locale as TypedLocale })
  return generateMeta({ doc: page })
}
