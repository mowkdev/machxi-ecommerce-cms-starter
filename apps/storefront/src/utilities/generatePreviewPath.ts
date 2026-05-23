import type { CollectionSlug, PayloadRequest } from "payload"

import { URL_DEFAULT_LOCALE } from "@/i18n/localization"

const collectionPrefixMap: Partial<Record<CollectionSlug, string>> = {
  pages: "",
}

type Props = {
  collection: keyof typeof collectionPrefixMap
  slug: string
  req: PayloadRequest
}

export const generatePreviewPath = ({ collection, slug, req }: Props) => {
  // Use the admin's current editing locale so the preview shows the right
  // language. Falls back to the default locale for non-localized requests.
  const locale =
    typeof req.locale === "string" && req.locale
      ? req.locale
      : URL_DEFAULT_LOCALE
  const prefix = collectionPrefixMap[collection] ?? ""
  const pagePath = slug === "home" ? "" : `/${slug}`
  const path = `/${locale}${prefix}${pagePath}`

  const params: Record<string, string> = {
    slug,
    collection,
    path,
  }

  const encodedParams = new URLSearchParams(params)

  return `/next/preview?${encodedParams.toString()}`
}
