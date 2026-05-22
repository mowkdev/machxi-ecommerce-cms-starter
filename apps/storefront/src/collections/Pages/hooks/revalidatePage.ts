import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from "payload"
import { revalidatePath, revalidateTag } from "next/cache"

import type { Page } from "@/payload-types"
import { LOCALE_CODES } from "@/i18n/localization"

function getPageURL(doc: Partial<Page> | null | undefined): string | null {
  if (!doc) return null
  const breadcrumbs = (doc as { breadcrumbs?: { url?: string | null }[] | null }).breadcrumbs
  if (Array.isArray(breadcrumbs) && breadcrumbs.length > 0) {
    const last = breadcrumbs[breadcrumbs.length - 1]
    if (last?.url) return last.url
  }
  return doc.slug ? `/${doc.slug}` : null
}

function revalidateForAllLocales(url: string, logger?: { info: (m: string) => void }) {
  for (const code of LOCALE_CODES) {
    const path = `/${code}${url}`
    logger?.info(`Revalidating page at path: ${path}`)
    revalidatePath(path, "page")
  }
  revalidateTag("pages-sitemap", "max")
}

export const revalidatePage: CollectionAfterChangeHook<Page> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (context?.disableRevalidate) return doc

  if (doc._status === "published") {
    const url = getPageURL(doc)
    if (url) revalidateForAllLocales(url, payload.logger)
  }

  if (previousDoc?._status === "published" && doc._status !== "published") {
    const oldUrl = getPageURL(previousDoc)
    if (oldUrl) revalidateForAllLocales(oldUrl, payload.logger)
  }

  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Page> = ({
  doc,
  req: { context },
}) => {
  if (context?.disableRevalidate) return doc
  const url = getPageURL(doc)
  if (url) revalidateForAllLocales(url)
  return doc
}
