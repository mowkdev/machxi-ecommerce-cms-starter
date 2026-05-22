import {
  BoldFeature,
  ItalicFeature,
  LinkFeature,
  ParagraphFeature,
  UnderlineFeature,
  lexicalEditor,
} from "@payloadcms/richtext-lexical"

export const defaultLexical = lexicalEditor({
  features: () => [
    ParagraphFeature(),
    UnderlineFeature(),
    BoldFeature(),
    ItalicFeature(),
    LinkFeature({
      enabledCollections: ["pages"],
      fields: ({ defaultFields }) => {
        const defaultFieldsWithoutUrl = defaultFields.filter((field) => {
          if ("name" in field && field.name === "url") return false
          return true
        })

        return [
          ...defaultFieldsWithoutUrl,
          {
            name: "url",
            type: "text",
            admin: {
              condition: (_data, siblingData) => siblingData?.linkType !== "internal",
            },
            label: ({ t }) => t("fields:enterURL"),
            required: true,
            validate: ((value: string | null | undefined, options: { siblingData?: { linkType?: string } }) => {
              if (options?.siblingData?.linkType === "internal") {
                return true
              }
              return value ? true : "URL is required"
            }) as never,
          },
        ]
      },
    }),
  ],
})
