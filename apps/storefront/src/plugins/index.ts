import type { Field, Plugin } from "payload"

import { nestedDocsPlugin } from "@payloadcms/plugin-nested-docs"
import { redirectsPlugin } from "@payloadcms/plugin-redirects"
import { seoPlugin } from "@payloadcms/plugin-seo"

import { revalidateRedirects } from "@/hooks/revalidateRedirects"
import { getServerSideURL } from "@/utilities/getURL"

type GenerateTitle = (args: { doc: { title?: string | null } }) => string
type GenerateURL = (args: { doc: { breadcrumbs?: { url?: string | null }[] | null; slug?: string | null } }) => string

const generateTitle: GenerateTitle = ({ doc }) => {
  return doc?.title ? `${doc.title} | MachXI` : "MachXI"
}

const generateURL: GenerateURL = ({ doc }) => {
  const url = getServerSideURL()
  const breadcrumbUrl = doc?.breadcrumbs?.[doc.breadcrumbs.length - 1]?.url
  if (breadcrumbUrl) return `${url}${breadcrumbUrl}`
  return doc?.slug ? `${url}/${doc.slug}` : url
}

export const plugins: Plugin[] = [
  redirectsPlugin({
    collections: ["pages"],
    overrides: {
      fields: ({ defaultFields }: { defaultFields: Field[] }): Field[] => {
        return defaultFields.map((field) => {
          if ("name" in field && field.name === "from") {
            return {
              ...field,
              admin: {
                description: "You will need to rebuild the website when changing this field.",
              },
            } as Field
          }
          return field
        })
      },
      hooks: {
        afterChange: [revalidateRedirects],
      },
    },
  }),
  nestedDocsPlugin({
    collections: ["pages"],
    generateURL: (docs) =>
      docs.reduce((url, doc) => `${url}/${doc.slug}`, ""),
  }),
  seoPlugin({
    generateTitle,
    generateURL,
  }),
]
