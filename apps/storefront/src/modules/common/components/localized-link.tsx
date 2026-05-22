"use client"

import type { ComponentProps } from "react"

import { Link } from "@/i18n/navigation"

/**
 * Wraps the next-intl Link so internal navigation automatically carries the
 * current URL locale prefix (eg. /en/products, /lv/products). External and
 * absolute URLs pass through unchanged. Country code (region) lives in a
 * cookie — see middleware.ts.
 */
export default function LocalizedLink(props: ComponentProps<typeof Link>) {
  return <Link {...props} />
}
