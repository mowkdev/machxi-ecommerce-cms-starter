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

  // Use the first country we find as the implicit region for product/category
  // fetching; URLs no longer include a country prefix.
  const fallbackCountry =
    (regions ?? [])
      .flatMap((r) => r.countries ?? [])
      .map((c) => c?.iso_2)
      .find((c): c is string => Boolean(c)) ?? "us"

  const lastModified = new Date()
  const entries: MetadataRoute.Sitemap = []

  for (const path of STATIC_PATHS) {
    entries.push({
      url: `${SITE_URL}${path}`,
      lastModified,
      changeFrequency: "weekly",
    })
  }

  try {
    const { products } = await listProducts({
      countryCode: fallbackCountry,
      query: { limit: 200, fields: "handle,updated_at" },
    })
    for (const p of products) {
      if (!p.handle) continue
      entries.push({
        url: `${SITE_URL}/products/${p.handle}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : lastModified,
        changeFrequency: "weekly",
      })
    }
  } catch {
    // Backend unavailable — skip products
  }

  try {
    const { collections } = await listCollections({ limit: "100" })
    for (const c of collections) {
      if (!c.handle) continue
      entries.push({
        url: `${SITE_URL}/collections/${c.handle}`,
        lastModified,
        changeFrequency: "weekly",
      })
    }
  } catch {
    // Backend unavailable — skip collections
  }

  return entries
}
