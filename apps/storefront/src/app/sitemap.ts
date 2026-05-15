import type { MetadataRoute } from "next"

import { listCollections } from "@/lib/data/collections"
import { listProducts } from "@/lib/data/products"
import { listRegions } from "@/lib/data/regions"

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://dabasberns.lv"

const STATIC_PATHS = [
  "",
  "/products",
  "/cart",
  "/sign-in",
  "/sign-up",
  "/forgot-password",
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const regions = await listRegions().catch(() => [])
  const countryCodes = (regions ?? [])
    .flatMap((r) => r.countries ?? [])
    .map((c) => c?.iso_2)
    .filter((c): c is string => Boolean(c))

  if (countryCodes.length === 0) countryCodes.push("us")

  const lastModified = new Date()
  const entries: MetadataRoute.Sitemap = []

  for (const cc of countryCodes) {
    for (const path of STATIC_PATHS) {
      entries.push({
        url: `${SITE_URL}/${cc}${path}`,
        lastModified,
        changeFrequency: "weekly",
      })
    }

    try {
      const { products } = await listProducts({
        countryCode: cc,
        query: { limit: 200, fields: "handle,updated_at" },
      })
      for (const p of products) {
        if (!p.handle) continue
        entries.push({
          url: `${SITE_URL}/${cc}/products/${p.handle}`,
          lastModified: p.updated_at ? new Date(p.updated_at) : lastModified,
          changeFrequency: "weekly",
        })
      }
    } catch {
      // Backend unavailable — skip products for this region
    }
  }

  try {
    const { collections } = await listCollections({ limit: "100" })
    const firstCountry = countryCodes[0]
    for (const c of collections) {
      if (!c.handle || !firstCountry) continue
      entries.push({
        url: `${SITE_URL}/${firstCountry}/collections/${c.handle}`,
        lastModified,
        changeFrequency: "weekly",
      })
    }
  } catch {
    // Backend unavailable — skip collections
  }

  return entries
}
