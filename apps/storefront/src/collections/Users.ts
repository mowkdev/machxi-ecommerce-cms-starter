import type { CollectionConfig } from "payload"

export const Users: CollectionConfig = {
  slug: "users",
  admin: {
    useAsTitle: "email",
    group: "Settings",
  },
  auth: {
    useAPIKey: true,
  },
  fields: [],
}
