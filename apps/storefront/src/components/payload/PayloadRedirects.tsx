import { notFound, redirect } from "next/navigation"
import { unstable_cache } from "next/cache"
import { getPayload } from "payload"
import configPromise from "@payload-config"

type Props = {
  disableNotFound?: boolean
  url: string
}

const getRedirects = unstable_cache(
  async () => {
    const payload = await getPayload({ config: configPromise })
    const { docs } = await payload.find({
      collection: "redirects",
      depth: 2,
      limit: 0,
      pagination: false,
      overrideAccess: false,
    })
    return docs
  },
  ["redirects"],
  { tags: ["redirects"] },
)

const DEFAULT_COUNTRY = process.env.NEXT_PUBLIC_DEFAULT_COUNTRY_CODE || "us"

export async function PayloadRedirects({ disableNotFound, url }: Props) {
  // Strip any leading /{countryCode} so the saved `from` (e.g. "/old") matches.
  const segments = url.split("/").filter(Boolean)
  const countryCode = segments[0] || DEFAULT_COUNTRY
  const lookupUrl = "/" + segments.slice(1).join("/")

  const redirects = await getRedirects().catch(() => [])

  const match = redirects.find(
    (r) => r.from === lookupUrl || r.from === url || r.from === lookupUrl + "/",
  ) as
    | {
        from: string
        to?: {
          type?: "reference" | "custom" | null
          reference?: { relationTo: "pages"; value: { slug?: string | null; breadcrumbs?: { url?: string | null }[] | null } | number } | null
          url?: string | null
        } | null
      }
    | undefined

  if (match?.to) {
    if (match.to.type === "custom" && match.to.url) {
      redirect(match.to.url)
    }
    if (match.to.type === "reference" && match.to.reference && typeof match.to.reference.value === "object") {
      const breadcrumbs = match.to.reference.value.breadcrumbs
      const last = breadcrumbs?.[breadcrumbs.length - 1]
      const refUrl = last?.url || (match.to.reference.value.slug ? `/${match.to.reference.value.slug}` : "")
      if (refUrl) {
        redirect(`/${countryCode}${refUrl.startsWith("/") ? refUrl : `/${refUrl}`}`)
      }
    }
  }

  if (disableNotFound) return null
  notFound()
}
