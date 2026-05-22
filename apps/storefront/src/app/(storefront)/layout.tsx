import type { Metadata } from "next"
import { Inter, Tenor_Sans } from "next/font/google"
import { getLocale } from "next-intl/server"

import "@/styles/globals.css"

import { themeNoFlashScript } from "@/modules/layout/components/theme-no-flash-script"
import { siteConfig } from "@/config/site"

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
})

const tenorSans = Tenor_Sans({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-tenor",
  display: "swap",
})

export const metadata: Metadata = {
  title: `${siteConfig.name} — Handmade rods & gear for cold, quiet lakes`,
  description: siteConfig.description,
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()

  return (
    <html
      lang={locale}
      data-theme="day"
      suppressHydrationWarning
      className={`${inter.variable} ${tenorSans.variable}`}
      style={
        {
          "--font-body":
            "var(--font-inter), -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",
          "--font-display":
            "var(--font-tenor), 'Optima', 'Albertus', 'Trajan Pro', serif",
        } as React.CSSProperties
      }
    >
      <head>
        {/*
          Runs before paint to set data-theme from localStorage,
          eliminating the flash of incorrect theme on first load.
          See `modules/layout/components/theme-provider.tsx`.
        */}
        <script dangerouslySetInnerHTML={{ __html: themeNoFlashScript }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
