import type { CollectionSlug, PayloadRequest } from "payload"

const collectionPrefixMap: Partial<Record<CollectionSlug, string>> = {
  pages: "",
}

type Props = {
  collection: keyof typeof collectionPrefixMap
  slug: string
  req: PayloadRequest
}

export const generatePreviewPath = ({ collection, slug }: Props) => {
  const defaultCountryCode = process.env.NEXT_PUBLIC_DEFAULT_COUNTRY_CODE || "us"
  const prefix = collectionPrefixMap[collection] ?? ""
  const pagePath = slug === "home" ? "" : `/${slug}`
  const path = `/${defaultCountryCode}${prefix}${pagePath}`

  const params: Record<string, string> = {
    slug,
    collection,
    path,
  }

  const encodedParams = new URLSearchParams(params)

  return `/next/preview?${encodedParams.toString()}`
}
