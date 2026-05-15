"use client"

import { usePathname } from "next/navigation"
import { useTransition } from "react"

import LocalizedLink from "@/modules/common/components/localized-link"
import { signout } from "@/lib/data/customer"

const items = [
  { href: "/account", label: "Overview" },
  { href: "/account/profile", label: "Profile" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/orders", label: "Orders" },
]

export function AccountNav({ countryCode }: { countryCode: string }) {
  const pathname = usePathname()
  const [pending, startTransition] = useTransition()

  const handleSignOut = () => {
    startTransition(async () => {
      await signout(countryCode)
    })
  }

  return (
    <>
      <span className="eb">Account</span>
      <nav aria-label="Account">
        {items.map((item) => {
          const fullHref = `/${countryCode}${item.href}`
          const active =
            pathname === fullHref ||
            (item.href !== "/account" && pathname.startsWith(`${fullHref}/`))
          return (
            <LocalizedLink
              key={item.href}
              href={item.href}
              className={active ? "current" : undefined}
              aria-current={active ? "page" : undefined}
            >
              {item.label}
            </LocalizedLink>
          )
        })}
      </nav>
      <button
        type="button"
        onClick={handleSignOut}
        disabled={pending}
        className="signout"
      >
        {pending ? "Signing out…" : "Sign out"}
      </button>
    </>
  )
}
