import type { Metadata } from "next"

import type { Media, Page } from "@/payload-types"
import { getServerSideURL } from "./getURL"
import { mergeOpenGraph } from "./mergeOpenGraph"

const getImageURL = (image?: Media | NonNullable<Page["meta"]>["image"] | string | number | null) => {
  const serverUrl = getServerSideURL()

  let url = `${serverUrl}/og-image.png`

  if (image && typeof image === "object" && "url" in image) {
    const sizeUrl = image.sizes?.card?.url
    url = sizeUrl ? serverUrl + sizeUrl : serverUrl + (image.url ?? "")
  }

  return url
}

export const generateMeta = async (args: {
  doc: Partial<Page> | null
}): Promise<Metadata> => {
  const { doc } = args

  const ogImage = getImageURL(doc?.meta?.image)

  const title = doc?.meta?.title
    ? doc.meta.title + " | MachXI"
    : "MachXI"

  return {
    description: doc?.meta?.description ?? undefined,
    openGraph: mergeOpenGraph({
      description: doc?.meta?.description ?? undefined,
      images: ogImage
        ? [
            {
              url: ogImage,
            },
          ]
        : undefined,
      title,
      url: Array.isArray(doc?.breadcrumbs)
        ? doc?.breadcrumbs?.[doc.breadcrumbs.length - 1]?.url ?? "/"
        : "/",
    }),
    title,
  }
}
