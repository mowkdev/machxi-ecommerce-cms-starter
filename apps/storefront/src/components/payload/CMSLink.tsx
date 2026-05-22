import Link from "next/link"
import type { ComponentProps } from "react"

import { Button } from "@/modules/common/ui/button"
import { cn } from "@/lib/utils"
import type { Page } from "@/payload-types"

type CMSLinkProps = {
  type?: "reference" | "custom" | null
  newTab?: boolean | null
  reference?: {
    relationTo: "pages"
    value: Page | number
  } | null
  url?: string | null
  label?: string | null
  appearance?: "default" | "outline" | "link" | null
  children?: React.ReactNode
  className?: string
  countryCode?: string
  size?: ComponentProps<typeof Button>["size"]
}

const DEFAULT_COUNTRY = process.env.NEXT_PUBLIC_DEFAULT_COUNTRY_CODE || "us"

function buildHref({
  type,
  reference,
  url,
  countryCode,
}: Pick<CMSLinkProps, "type" | "reference" | "url" | "countryCode">) {
  const cc = countryCode || DEFAULT_COUNTRY

  if (type === "custom" && url) {
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("mailto:")) {
      return url
    }
    return `/${cc}${url.startsWith("/") ? url : `/${url}`}`
  }

  if (type === "reference" && reference && typeof reference.value === "object") {
    const breadcrumbs = reference.value.breadcrumbs
    const last = breadcrumbs?.[breadcrumbs.length - 1]
    const refUrl = last?.url || (reference.value.slug ? `/${reference.value.slug}` : "")
    if (!refUrl) return `/${cc}`
    return `/${cc}${refUrl.startsWith("/") ? refUrl : `/${refUrl}`}`
  }

  return null
}

export function CMSLink({
  type,
  newTab,
  reference,
  url,
  label,
  appearance,
  children,
  className,
  countryCode,
  size,
}: CMSLinkProps) {
  const href = buildHref({ type, reference, url, countryCode })
  if (!href) return null

  const target = newTab ? "_blank" : undefined
  const rel = newTab ? "noopener noreferrer" : undefined
  const content = children ?? label

  if (appearance === "link" || appearance == null) {
    return (
      <Link
        href={href}
        target={target}
        rel={rel}
        className={cn(
          "text-ink underline-offset-4 hover:underline",
          className,
        )}
      >
        {content}
      </Link>
    )
  }

  return (
    <Button asChild variant={appearance} size={size}>
      <Link href={href} target={target} rel={rel} className={className}>
        {content}
      </Link>
    </Button>
  )
}
