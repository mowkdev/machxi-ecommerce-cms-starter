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

// Defense in depth: even if the admin UI readOnly is bypassed (custom field
// component bug, direct REST call without admin), refuse a write that changes
// the array length. Combined with `admin.readOnly: true` on the array fields,
// admins cannot add or remove options/variants from Payload.
const lockCount: Validate = (value, { previousValue }) => {
  if (!Array.isArray(value) || !Array.isArray(previousValue)) return true
  if (value.length !== previousValue.length) {
    return "Count is managed by Medusa and cannot be changed from Payload."
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
    {
      // Read-only mirror of the Medusa thumbnail URL. Not a Payload upload —
      // the canonical asset lives in Medusa's file store.
      name: "thumbnail",
      type: "text",
      admin: {
        readOnly: true,
        description: "Mirror of Medusa's thumbnail URL. Manage in Medusa.",
      },
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
      admin: {
        readOnly: true,
        description: "Mirror of Medusa options. Managed by Medusa.",
      },
      validate: lockCount,
      fields: [
        { name: "medusa_id", type: "text", required: true, admin: { readOnly: true } },
        { name: "title", type: "text", admin: { readOnly: true } },
        {
          name: "values",
          type: "array",
          admin: { readOnly: true },
          validate: lockCount,
          fields: [{ name: "value", type: "text", admin: { readOnly: true } }],
        },
      ],
    },
    {
      name: "variants",
      type: "array",
      admin: {
        readOnly: true,
        description: "Mirror of Medusa variants. Managed by Medusa.",
      },
      validate: lockCount,
      fields: [
        { name: "medusa_id", type: "text", required: true, admin: { readOnly: true } },
        { name: "title", type: "text", admin: { readOnly: true } },
        { name: "sku", type: "text", admin: { readOnly: true } },
        {
          name: "option_values",
          type: "array",
          admin: { readOnly: true },
          validate: lockCount,
          fields: [
            { name: "option_medusa_id", type: "text", admin: { readOnly: true } },
            { name: "value", type: "text", admin: { readOnly: true } },
          ],
        },
      ],
    },
  ],
}
