import type { MetadataRoute } from "next"

import { listCollections } from "@/lib/data/collections"
import { listProducts } from "@/lib/data/products"
import { listRegions } from "@/lib/data/regions"
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_CODES,
} from "@/i18n/localization"

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

function alternatesFor(path: string): MetadataRoute.Sitemap[number]["alternates"] {
  const languages: Record<string, string> = {}
  for (const code of LOCALE_CODES) {
    languages[code] = `${SITE_URL}/${code}${path}`
  }
  languages["x-default"] = `${SITE_URL}/${DEFAULT_LOCALE}${path}`
  return { languages }
}

function entriesForPath(
  path: string,
  lastModified: Date | string,
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]
): MetadataRoute.Sitemap {
  const alternates = alternatesFor(path)
  return LOCALES.map((locale) => ({
    url: `${SITE_URL}/${locale.code}${path}`,
    lastModified,
    changeFrequency,
    alternates,
  }))
}

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
    entries.push(...entriesForPath(path, lastModified, "weekly"))
  }

  try {
    const { products } = await listProducts({
      countryCode: fallbackCountry,
      query: { limit: 200, fields: "handle,updated_at" },
    })
    for (const p of products) {
      if (!p.handle) continue
      const lm = p.updated_at ? new Date(p.updated_at) : lastModified
      entries.push(...entriesForPath(`/products/${p.handle}`, lm, "weekly"))
    }
  } catch {
    // Backend unavailable — skip products
  }

  try {
    const { collections } = await listCollections({ limit: "100" })
    for (const c of collections) {
      if (!c.handle) continue
      entries.push(
        ...entriesForPath(`/collections/${c.handle}`, lastModified, "weekly")
      )
    }
  } catch {
    // Backend unavailable — skip collections
  }

  return entries
}
