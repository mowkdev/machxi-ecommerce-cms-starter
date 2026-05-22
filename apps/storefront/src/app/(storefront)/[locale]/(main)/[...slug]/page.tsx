import type { Metadata } from "next"
import type { TypedLocale } from "payload"

import { PageContent } from "@/components/payload/PageContent"
import { PayloadRedirects } from "@/components/payload/PayloadRedirects"
import { getPageByUrl } from "@/queries/pages"
import { generateMeta } from "@/utilities/generateMeta"

type Params = { slug?: string[]; locale: string }

export async function generateStaticParams() {
  // Pages are rendered dynamically and revalidate on publish.
  return []
}

function buildUrl(slug: string[]): string {
  return "/" + slug.map((s) => decodeURIComponent(s)).join("/")
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { slug = [], locale } = await params
  const url = buildUrl(slug)
  const page = await getPageByUrl({ url, locale: locale as TypedLocale })

  if (!page) return <PayloadRedirects url={url} />

  return <PageContent page={page} url={url} />
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { slug = [], locale } = await params
  const url = buildUrl(slug)
  const page = await getPageByUrl({ url, locale: locale as TypedLocale })
  return generateMeta({ doc: page })
}
