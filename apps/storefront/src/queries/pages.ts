import { cache } from "react"
import { draftMode } from "next/headers"
import { getPayload, type TypedLocale } from "payload"
import configPromise from "@payload-config"

import type { Page } from "@/payload-types"

type ByArgs = { locale: TypedLocale }

export const getPageBySlug = cache(
  async ({ slug, locale }: ByArgs & { slug: string }): Promise<Page | null> => {
    const { isEnabled: draft } = await draftMode()
    const payload = await getPayload({ config: configPromise })

    const result = await payload.find({
      collection: "pages",
      draft,
      limit: 1,
      pagination: false,
      overrideAccess: draft,
      locale,
      where: { slug: { equals: slug } },
    })

    return (result.docs?.[0] as Page | undefined) ?? null
  },
)

export const getPageByUrl = cache(
  async ({ url, locale }: ByArgs & { url: string }): Promise<Page | null> => {
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
  },
)
