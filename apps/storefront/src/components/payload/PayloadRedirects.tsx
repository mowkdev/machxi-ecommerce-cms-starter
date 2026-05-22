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

export async function PayloadRedirects({ disableNotFound, url }: Props) {
  const redirects = await getRedirects().catch(() => [])

  const match = redirects.find(
    (r) => r.from === url || r.from === url + "/",
  ) as
    | {
        from: string
        to?: {
          type?: "reference" | "custom" | null
          reference?: {
            relationTo: "pages"
            value:
              | {
                  slug?: string | null
                  breadcrumbs?: { url?: string | null }[] | null
                }
              | number
          } | null
          url?: string | null
        } | null
      }
    | undefined

  if (match?.to) {
    if (match.to.type === "custom" && match.to.url) {
      redirect(match.to.url)
    }
    if (
      match.to.type === "reference" &&
      match.to.reference &&
      typeof match.to.reference.value === "object"
    ) {
      const breadcrumbs = match.to.reference.value.breadcrumbs
      const last = breadcrumbs?.[breadcrumbs.length - 1]
      const refUrl =
        last?.url ||
        (match.to.reference.value.slug
          ? `/${match.to.reference.value.slug}`
          : "")
      if (refUrl) {
        redirect(refUrl.startsWith("/") ? refUrl : `/${refUrl}`)
      }
    }
  }

  if (disableNotFound) return null
  notFound()
}
