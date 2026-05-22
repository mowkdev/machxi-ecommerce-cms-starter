"use client"

import Link from "next/link"
import type { ComponentProps } from "react"

/**
 * Country code is now stored in a cookie instead of a URL prefix, so this is
 * a thin wrapper around Next's `Link`. We keep the component name and export
 * to avoid churn at all the call sites that imported it.
 */
export default function LocalizedLink(props: ComponentProps<typeof Link>) {
  return <Link {...props} />
}
