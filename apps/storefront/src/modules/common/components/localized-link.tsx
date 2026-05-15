"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import type { ComponentProps } from "react"

type LinkProps = ComponentProps<typeof Link>

function localize(href: string, countryCode: string | undefined): string {
  if (!countryCode) return href
  if (!href.startsWith("/")) return href
  if (href === "/") return `/${countryCode}`
  const firstSegment = href.split("/")[1]?.toLowerCase()
  if (firstSegment === countryCode.toLowerCase()) return href
  return `/${countryCode}${href}`
}

export default function LocalizedLink({ href, ...rest }: LinkProps) {
  const params = useParams<{ countryCode?: string }>()
  const cc = params?.countryCode
  const finalHref = typeof href === "string" ? localize(href, cc) : href
  return <Link href={finalHref} {...rest} />
}
