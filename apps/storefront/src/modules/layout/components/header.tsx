"use client"

import LocalizedLink from "@/modules/common/components/localized-link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

import { useCartUi } from "@/modules/cart/components/cart-panel"
import { useCart } from "@/modules/cart/components/cart-provider"
import { useMobileMenu } from "@/modules/layout/components/mobile-menu"
import { ThemeToggle } from "@/modules/layout/components/theme-toggle"
import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"

function isNavActive(pathname: string, href: string) {
  if (href === "#") return false
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function Header({ solid }: { solid?: boolean }) {
  const [scrolled, setScrolled] = useState(false)
  const { open: openCart } = useCartUi()
  const { itemCount } = useCart()
  const { open: openMenu } = useMobileMenu()
  const pathname = usePathname()

  // Home is the only route that lets the parallax hero show through; everything
  // else renders the solid chrome by default. Caller can still override with `solid`.
  const isHomeRoute = pathname.split("/").filter(Boolean).length <= 1
  const forceSolid = solid ?? !isHomeRoute

  useEffect(() => {
    if (forceSolid) {
      setScrolled(true)
      return
    }
    const update = () => {
      const heroEl = document.getElementById("parallax-section")
      if (!heroEl) {
        setScrolled(window.scrollY > 40)
        return
      }
      const rect = heroEl.getBoundingClientRect()
      const total = heroEl.offsetHeight - window.innerHeight
      const scrolledPx = Math.min(Math.max(-rect.top, 0), total)
      setScrolled(scrolledPx >= total - 4)
    }
    update()
    window.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", update)
    return () => {
      window.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
    }
  }, [forceSolid])

  const showSolid = forceSolid || scrolled

  return (
    <nav
      className={cn(
        "nav fixed inset-x-0 top-0 z-50 flex items-center justify-between px-[var(--pad)] py-[18px] border-b border-transparent transition-[background-color,color,border-color,backdrop-filter] duration-200",
        forceSolid ? "text-[var(--ink)]" : "text-[var(--on-sky-fg)]",
        showSolid &&
          "bg-[color-mix(in_srgb,var(--paper)_86%,transparent)] backdrop-blur-md text-ink border-b-[color-mix(in_srgb,var(--ink)_8%,transparent)]"
      )}
    >
      <button
        className="nav-hamburger"
        type="button"
        aria-label="Open menu"
        onClick={openMenu}
        style={{ color: "inherit" }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
        >
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      <LocalizedLink
        href="/"
        className="brand flex items-center no-underline"
        style={{ color: "inherit" }}
        aria-label="Dabasberns — home"
      >
        <span
          className="block w-[34px] h-[34px]"
          role="img"
          aria-label="Dabasberns"
          style={{
            backgroundColor: "currentColor",
            WebkitMaskImage: "url(/assets/logo-icon.svg)",
            WebkitMaskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskImage: "url(/assets/logo-icon.svg)",
            maskSize: "contain",
            maskRepeat: "no-repeat",
            maskPosition: "center",
          }}
        />
      </LocalizedLink>

      <div className="links hidden md:flex gap-9 text-[14px] tracking-[0.04em] uppercase">
        {siteConfig.nav.map((item) => {
          const active = isNavActive(pathname, item.href)
          return (
            <LocalizedLink
              key={item.label}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "transition-opacity no-underline",
                active ? "opacity-100" : "opacity-85 hover:opacity-100"
              )}
              style={{
                color: "inherit",
                textDecoration: active ? "underline" : "none",
                textUnderlineOffset: active ? "6px" : undefined,
                textDecorationThickness: active ? "1px" : undefined,
              }}
            >
              {item.label}
            </LocalizedLink>
          )
        })}
      </div>

      <div className="nav-actions inline-flex items-center gap-2.5">
        <ThemeToggle />
        <LocalizedLink
          href="/account"
          className="icon-btn"
          aria-label="Account"
          style={{ color: "inherit" }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="8" r="3.5" />
            <path d="M5 20c1.2-3.5 4.1-5.5 7-5.5s5.8 2 7 5.5" />
          </svg>
        </LocalizedLink>
        <button
          type="button"
          className="icon-btn cart-btn"
          aria-label="Cart"
          onClick={openCart}
          style={{ color: "inherit" }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 7h14l-1.4 11a2 2 0 0 1-2 1.8H8.4a2 2 0 0 1-2-1.8L5 7z" />
            <path d="M9 7V5.5a3 3 0 0 1 6 0V7" />
          </svg>
          {itemCount > 0 && <span className="badge">{itemCount}</span>}
        </button>
      </div>
    </nav>
  )
}
