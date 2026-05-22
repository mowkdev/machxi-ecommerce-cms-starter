import type { Block } from "payload"

export const ShopCta: Block = {
  slug: "shopCta",
  interfaceName: "ShopCtaBlock",
  labels: { singular: "Shop CTA", plural: "Shop CTA blocks" },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Copy",
          fields: [
            { name: "eyebrow", type: "text", localized: true },
            { name: "headlinePrefix", type: "text", localized: true },
            {
              name: "headlineAccent",
              type: "text",
              localized: true,
              admin: { description: "Emphasised word inside the headline." },
            },
            { name: "headlineSuffix", type: "text", localized: true },
            {
              name: "paragraphs",
              type: "array",
              localized: true,
              labels: { singular: "Paragraph", plural: "Paragraphs" },
              fields: [{ name: "text", type: "textarea", required: true }],
            },
          ],
        },
        {
          label: "Call to action",
          fields: [
            { name: "ctaLabel", type: "text", required: true, localized: true },
            {
              name: "ctaHref",
              type: "text",
              required: true,
              admin: { description: "Relative path (e.g. /products) or absolute URL." },
            },
          ],
        },
        {
          label: "Stamp",
          fields: [
            {
              name: "stamp",
              type: "group",
              label: false,
              fields: [
                { name: "line1", type: "text", localized: true },
                { name: "line2", type: "text", localized: true },
                {
                  name: "small",
                  type: "text",
                  admin: { description: "Small text under the stamp (e.g. № 24)." },
                },
              ],
            },
          ],
        },
        {
          label: "Stats",
          fields: [
            {
              name: "stats",
              type: "array",
              maxRows: 4,
              labels: { singular: "Stat", plural: "Stats" },
              fields: [
                { name: "value", type: "text", required: true },
                { name: "label", type: "text", required: true, localized: true },
              ],
            },
          ],
        },
        {
          label: "Images",
          fields: [
            {
              name: "images",
              type: "array",
              maxRows: 3,
              labels: { singular: "Image", plural: "Images" },
              admin: { description: "Up to three Polaroid-style images." },
              fields: [
                { name: "media", type: "upload", relationTo: "media" },
                { name: "alt", type: "text", localized: true },
                { name: "captionLeft", type: "text", localized: true },
                { name: "captionRight", type: "text", localized: true },
              ],
            },
          ],
        },
      ],
    },
  ],
}
