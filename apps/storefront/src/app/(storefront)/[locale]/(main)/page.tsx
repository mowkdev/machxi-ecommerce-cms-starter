import type { Metadata } from "next"
import { notFound } from "next/navigation"
import type { TypedLocale } from "payload"

import { PageContent } from "@/components/payload/PageContent"
import { getPageBySlug } from "@/queries/pages"
import { generateMeta } from "@/utilities/generateMeta"

type Params = { locale: string }

const HOME_SLUG = "home"

export default async function HomePage({
  params,
}: {
  params: Promise<Params>
}) {
  const { locale } = await params
  const page = await getPageBySlug({
    slug: HOME_SLUG,
    locale: locale as TypedLocale,
  })

  if (!page) notFound()

  return <PageContent page={page} />
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { locale } = await params
  const page = await getPageBySlug({
    slug: HOME_SLUG,
    locale: locale as TypedLocale,
  })
  return generateMeta({ doc: page })
}
