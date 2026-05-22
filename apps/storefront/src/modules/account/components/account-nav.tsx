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

export function AccountNav() {
  const pathname = usePathname()
  const [pending, startTransition] = useTransition()

  const handleSignOut = () => {
    startTransition(async () => {
      await signout()
    })
  }

  return (
    <>
      <span className="eb">Account</span>
      <nav aria-label="Account">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/account" && pathname.startsWith(`${item.href}/`))
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
