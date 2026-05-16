import type { CollectionConfig, FieldHook, Validate } from "payload"

const ensureLexicalDescription: FieldHook = ({ value }) => {
  if (!value || typeof value !== "string") return value
  // Minimal Lexical document wrapping plain text from Medusa.
  return {
    root: {
      type: "root",
      format: "",
      indent: 0,
      version: 1,
      children: [
        {
          type: "paragraph",
          format: "",
          indent: 0,
          version: 1,
          children: [
            { type: "text", text: value, format: 0, version: 1, detail: 0, mode: "normal", style: "" },
          ],
        },
      ],
      direction: null,
    },
  }
}

const lockCount: Validate = (value, { siblingData, previousValue }) => {
  if (!Array.isArray(value) || !Array.isArray(previousValue)) return true
  if (value.length !== previousValue.length) {
    return "Count must match Medusa; changes are read-only from the admin UI."
  }
  return true
}

const isAdminOrApiKey = ({ req }: { req: { user?: { collection?: string } | null } }) => {
  return Boolean(req.user)
}

export const Products: CollectionConfig = {
  slug: "products",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "handle", "medusa_id", "updatedAt"],
  },
  access: {
    create: isAdminOrApiKey,
    update: isAdminOrApiKey,
    delete: isAdminOrApiKey,
    read: () => true,
  },
  fields: [
    { name: "medusa_id", type: "text", required: true, unique: true, index: true, admin: { readOnly: true } },
    { name: "title", type: "text" },
    { name: "handle", type: "text", admin: { readOnly: true } },
    { name: "subtitle", type: "text" },
    {
      name: "description",
      type: "richText",
      hooks: { beforeChange: [ensureLexicalDescription] },
    },
    { name: "thumbnail", type: "upload", relationTo: "media" },
    {
      name: "images",
      type: "array",
      fields: [{ name: "image", type: "upload", relationTo: "media", required: true }],
    },
    {
      name: "seo",
      type: "group",
      fields: [
        { name: "title", type: "text" },
        { name: "description", type: "textarea" },
        { name: "keywords", type: "text" },
      ],
    },
    {
      name: "options",
      type: "array",
      admin: { description: "Mirror of Medusa options. Count is managed by Medusa." },
      validate: lockCount,
      fields: [
        { name: "medusa_id", type: "text", required: true, admin: { readOnly: true } },
        { name: "title", type: "text" },
        { name: "values", type: "array", fields: [{ name: "value", type: "text" }] },
      ],
    },
    {
      name: "variants",
      type: "array",
      admin: { description: "Mirror of Medusa variants. Count is managed by Medusa." },
      validate: lockCount,
      fields: [
        { name: "medusa_id", type: "text", required: true, admin: { readOnly: true } },
        { name: "title", type: "text" },
        { name: "sku", type: "text", admin: { readOnly: true } },
        {
          name: "option_values",
          type: "array",
          fields: [
            { name: "option_medusa_id", type: "text" },
            { name: "value", type: "text" },
          ],
        },
      ],
    },
  ],
}
