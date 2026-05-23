import type { GlobalConfig } from "payload"

export const MedusaIntegration: GlobalConfig = {
  slug: "medusa-integration",
  label: "Medusa Integration",
  access: {
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
  },
  admin: {
    description:
      "Cross-app keys that wire this storefront to the Medusa backend. Read by the server-side Medusa SDK factory.",
  },
  fields: [
    {
      name: "publishableKey",
      type: "text",
      required: true,
      admin: {
        description:
          "Paste the default key from Medusa Admin → Settings → Publishable API Keys. Saving here invalidates the storefront's SDK cache.",
      },
    },
  ],
  hooks: {
    afterChange: [
      async () => {
        const { revalidateTag } = await import("next/cache")
        revalidateTag("medusa-integration")
      },
    ],
  },
}
