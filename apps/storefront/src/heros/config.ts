import type { Field } from "payload"

import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from "@payloadcms/richtext-lexical"

import { linkGroup } from "@/fields/linkGroup"

const hidesContentFields = (type: unknown) => type !== "parallax"

export const hero: Field = {
  name: "hero",
  type: "group",
  label: false,
  fields: [
    {
      name: "type",
      type: "select",
      defaultValue: "lowImpact",
      label: "Type",
      required: true,
      options: [
        { label: "None", value: "none" },
        { label: "Parallax", value: "parallax" },
        { label: "High Impact", value: "highImpact" },
        { label: "Medium Impact", value: "mediumImpact" },
        { label: "Low Impact", value: "lowImpact" },
      ],
    },
    {
      name: "richText",
      type: "richText",
      label: false,
      admin: {
        condition: (_, { type } = {}) => hidesContentFields(type),
      },
      editor: lexicalEditor({
        features: ({ rootFeatures }) => [
          ...rootFeatures,
          HeadingFeature({ enabledHeadingSizes: ["h1", "h2", "h3", "h4"] }),
          FixedToolbarFeature(),
          InlineToolbarFeature(),
        ],
      }),
    },
    linkGroup({
      overrides: {
        maxRows: 2,
        admin: { condition: (_, { type } = {}) => hidesContentFields(type) },
      },
    }),
    {
      name: "media",
      type: "upload",
      relationTo: "media",
      required: true,
      admin: {
        condition: (_, { type } = {}) => ["highImpact", "mediumImpact"].includes(type),
      },
    },
  ],
}
