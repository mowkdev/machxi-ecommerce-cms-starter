import type { Block } from "payload"

export const Creator: Block = {
  slug: "creator",
  interfaceName: "CreatorBlock",
  labels: { singular: "Creator", plural: "Creator blocks" },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Video",
          fields: [
            {
              name: "video",
              type: "group",
              label: false,
              fields: [
                {
                  name: "youtubeId",
                  type: "text",
                  required: true,
                  admin: { description: "YouTube video ID (the v= part of the URL)." },
                },
                { name: "title", type: "text", localized: true },
                {
                  name: "posterImage",
                  type: "upload",
                  relationTo: "media",
                  admin: { description: "Optional thumbnail shown before the video loads." },
                },
              ],
            },
          ],
        },
        {
          label: "Author",
          fields: [
            {
              name: "author",
              type: "group",
              label: false,
              fields: [
                { name: "eyebrow", type: "text", localized: true },
                { name: "headlinePrefix", type: "text", localized: true },
                {
                  name: "headlineAccent",
                  type: "text",
                  localized: true,
                  admin: { description: "Italicised emphasis word inside the headline." },
                },
                { name: "headlineSuffix", type: "text", localized: true },
                {
                  name: "paragraphs",
                  type: "array",
                  localized: true,
                  labels: { singular: "Paragraph", plural: "Paragraphs" },
                  fields: [{ name: "text", type: "textarea", required: true }],
                },
                { name: "signName", type: "text", localized: true },
                { name: "signRole", type: "text", localized: true },
              ],
            },
          ],
        },
        {
          label: "Socials",
          fields: [
            {
              name: "socials",
              type: "group",
              label: false,
              fields: [
                { name: "eyebrow", type: "text", localized: true },
                { name: "heading", type: "text", localized: true },
                {
                  name: "total",
                  type: "group",
                  fields: [
                    { name: "value", type: "text" },
                    { name: "label", type: "text", localized: true },
                  ],
                },
                {
                  name: "accounts",
                  type: "array",
                  labels: { singular: "Account", plural: "Accounts" },
                  fields: [
                    {
                      name: "platform",
                      type: "select",
                      required: true,
                      options: [
                        { label: "YouTube", value: "youtube" },
                        { label: "Instagram", value: "instagram" },
                        { label: "TikTok", value: "tiktok" },
                        { label: "X", value: "x" },
                        { label: "Facebook", value: "facebook" },
                      ],
                    },
                    { name: "url", type: "text", required: true },
                    { name: "handle", type: "text", required: true },
                    { name: "count", type: "text" },
                    { name: "countLabel", type: "text", localized: true },
                    { name: "cta", type: "text", localized: true },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
