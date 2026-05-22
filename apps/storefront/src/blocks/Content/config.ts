import type { Block, Field } from "payload"

import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from "@payloadcms/richtext-lexical"

import { link } from "@/fields/link"

const columnFields: Field[] = [
  {
    name: "size",
    type: "select",
    defaultValue: "oneThird",
    options: [
      { label: "One Third", value: "oneThird" },
      { label: "Half", value: "half" },
      { label: "Two Thirds", value: "twoThirds" },
      { label: "Full", value: "full" },
    ],
  },
  {
    name: "richText",
    type: "richText",
    label: false,
    editor: lexicalEditor({
      features: ({ rootFeatures }) => [
        ...rootFeatures,
        HeadingFeature({ enabledHeadingSizes: ["h2", "h3", "h4"] }),
        FixedToolbarFeature(),
        InlineToolbarFeature(),
      ],
    }),
  },
  {
    name: "enableLink",
    type: "checkbox",
  },
  link({
    appearances: false,
    overrides: {
      admin: {
        condition: (_data, siblingData) => Boolean(siblingData?.enableLink),
      },
    },
  }),
]

export const Content: Block = {
  slug: "content",
  interfaceName: "ContentBlock",
  fields: [
    {
      name: "columns",
      type: "array",
      admin: { initCollapsed: true },
      fields: columnFields,
    },
  ],
}
