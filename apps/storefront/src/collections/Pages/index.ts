import type { CollectionConfig } from "payload"
import { slugField } from "payload"
import { createBreadcrumbsField } from "@payloadcms/plugin-nested-docs"

import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from "@payloadcms/plugin-seo/fields"

import { authenticated } from "@/access/authenticated"
import { authenticatedOrPublished } from "@/access/authenticatedOrPublished"
import { CallToAction } from "@/blocks/CallToAction/config"
import { Content } from "@/blocks/Content/config"
import { Creator } from "@/blocks/Creator/config"
import { MediaBlock } from "@/blocks/MediaBlock/config"
import { ShopCta } from "@/blocks/ShopCta/config"
import { hero } from "@/heros/config"
import { populatePublishedAt } from "@/hooks/populatePublishedAt"
import { generatePreviewPath } from "@/utilities/generatePreviewPath"

import { revalidateDelete, revalidatePage } from "./hooks/revalidatePage"

export const Pages: CollectionConfig<"pages"> = {
  slug: "pages",
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  defaultPopulate: {
    title: true,
    slug: true,
    breadcrumbs: true,
  },
  admin: {
    group: "Content",
    defaultColumns: ["title", "slug", "updatedAt"],
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({
          slug: typeof data?.slug === "string" ? data.slug : "",
          collection: "pages",
          req,
        }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: typeof data?.slug === "string" ? data.slug : "",
        collection: "pages",
        req,
      }),
    useAsTitle: "title",
  },
  fields: [
    { name: "title", type: "text", required: true, localized: true },
    {
      type: "tabs",
      tabs: [
        {
          label: "Hero",
          fields: [hero],
        },
        {
          label: "Content",
          fields: [
            {
              name: "layout",
              type: "blocks",
              required: true,
              blocks: [CallToAction, Content, MediaBlock, Creator, ShopCta],
              admin: { initCollapsed: true },
              localized: true,
            },
          ],
        },
        {
          label: "SEO",
          name: "meta",
          fields: [
            OverviewField({
              titlePath: "meta.title",
              descriptionPath: "meta.description",
              imagePath: "meta.image",
            }),
            MetaTitleField({ hasGenerateFn: true }),
            MetaImageField({ relationTo: "media" }),
            MetaDescriptionField({}),
            PreviewField({
              hasGenerateFn: true,
              titlePath: "meta.title",
              descriptionPath: "meta.description",
            }),
          ],
        },
        {
          label: "Advanced",
          fields: [
            // Pre-declared so nestedDocsPlugin places the auto-generated
            // breadcrumbs here instead of pushing a duplicate field after the
            // tabs (which would render under every tab).
            createBreadcrumbsField("pages", {
              admin: {
                description:
                  "Auto-generated URL chain from the parent hierarchy. Updates on save.",
              },
            }),
          ],
        },
      ],
    },
    {
      name: "publishedAt",
      type: "date",
      admin: { position: "sidebar" },
    },
    slugField(),
  ],
  hooks: {
    beforeChange: [populatePublishedAt],
    afterChange: [revalidatePage],
    afterDelete: [revalidateDelete],
  },
  versions: {
    drafts: {
      autosave: { interval: 100 },
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
}
