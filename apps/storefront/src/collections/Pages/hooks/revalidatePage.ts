import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from "payload"
import { revalidatePath, revalidateTag } from "next/cache"

import type { Page } from "@/payload-types"

const DEFAULT_COUNTRY = process.env.NEXT_PUBLIC_DEFAULT_COUNTRY_CODE || "us"

function getPageURL(doc: Partial<Page> | null | undefined): string | null {
  if (!doc) return null
  const breadcrumbs = (doc as { breadcrumbs?: { url?: string | null }[] | null }).breadcrumbs
  if (Array.isArray(breadcrumbs) && breadcrumbs.length > 0) {
    const last = breadcrumbs[breadcrumbs.length - 1]
    if (last?.url) return last.url
  }
  return doc.slug ? `/${doc.slug}` : null
}

export const revalidatePage: CollectionAfterChangeHook<Page> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (context?.disableRevalidate) return doc

  if (doc._status === "published") {
    const url = getPageURL(doc)
    if (url) {
      const path = `/${DEFAULT_COUNTRY}${url}`
      payload.logger.info(`Revalidating page at path: ${path}`)
      revalidatePath(path, "page")
      revalidateTag("pages-sitemap", "max")
    }
  }

  if (previousDoc?._status === "published" && doc._status !== "published") {
    const oldUrl = getPageURL(previousDoc)
    if (oldUrl) {
      const oldPath = `/${DEFAULT_COUNTRY}${oldUrl}`
      payload.logger.info(`Revalidating old page at path: ${oldPath}`)
      revalidatePath(oldPath, "page")
      revalidateTag("pages-sitemap", "max")
    }
  }

  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Page> = ({
  doc,
  req: { context },
}) => {
  if (context?.disableRevalidate) return doc
  const url = getPageURL(doc)
  if (url) {
    revalidatePath(`/${DEFAULT_COUNTRY}${url}`, "page")
    revalidateTag("pages-sitemap", "max")
  }
  return doc
}
