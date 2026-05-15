export const siteConfig = {
  name: "Dabasberns",
  description:
    "Handmade rods, hand-tied flies, and small things to take with you to a cold, quiet lake.",
  eyebrow: "Est. Kurzeme · 2014",
  hero: {
    title: "Dabasberns",
    tagline:
      "Handmade rods, hand-tied flies, and small things to take with you to a cold, quiet lake.",
  },
  nav: [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/shop" },
    { label: "Journal", href: "#" },
  ],
  cart: { count: 2 },
  footer: {
    blurb:
      "Hand-built rods and quiet gear from a workshop on the Kurzeme coast. Shipped Tuesdays.",
    columns: [
      {
        title: "Shop",
        links: [
          { label: "Rods", href: "#" },
          { label: "Reels & Lines", href: "#" },
          { label: "Flies & Lures", href: "#" },
          { label: "Accessories", href: "#" },
          { label: "Gift card", href: "#" },
        ],
      },
      {
        title: "Workshop",
        links: [
          { label: "Our story", href: "#" },
          { label: "Custom builds", href: "#" },
          { label: "Repairs", href: "#" },
          { label: "Journal", href: "#" },
        ],
      },
      {
        title: "Help",
        links: [
          { label: "Shipping", href: "#" },
          { label: "Returns", href: "#" },
          { label: "Contact", href: "#" },
          { label: "Instagram", href: "#" },
        ],
      },
    ],
    legal: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
      { label: "Imprint", href: "#" },
    ],
    copyright: "© 2026 Dabasberns SIA · Kuldīga, Latvia",
  },
} as const

export type SiteConfig = typeof siteConfig
