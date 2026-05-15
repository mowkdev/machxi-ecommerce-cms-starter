"use client"

import LocalizedLink from "@/modules/common/components/localized-link"
import { usePathname } from "next/navigation"
import {
  createContext,
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

import { cn } from "@/lib/utils"

function isNavActive(pathname: string, href: string) {
  if (href === "#") return false
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}

type MobileMenuContextValue = {
  isOpen: boolean
  open: () => void
  close: () => void
}

const MobileMenuContext = createContext<MobileMenuContextValue | null>(null)

export function MobileMenuProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false)
  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  useEffect(() => {
    if (!isOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener("keydown", onKey)
    }
  }, [isOpen])

  const value = useMemo(() => ({ isOpen, open, close }), [isOpen, open, close])

  return (
    <MobileMenuContext.Provider value={value}>
      {children}
      <MobileMenuPanel />
    </MobileMenuContext.Provider>
  )
}

export function useMobileMenu(): MobileMenuContextValue {
  const ctx = useContext(MobileMenuContext)
  if (!ctx) {
    throw new Error("useMobileMenu must be used inside <MobileMenuProvider>")
  }
  return ctx
}

const PRIMARY_NAV = [
  { label: "Home", href: "/" },
  { label: "Products", href: "/products" },
  { label: "Journal", href: "#" },
]

const SHOP_BY = [
  { label: "Rods", href: "/products", count: "14" },
  { label: "Reels & Lines", href: "#", count: "09" },
  { label: "Flies & Lures", href: "#", count: "42" },
  { label: "Accessories", href: "#", count: "11" },
  { label: "Sale", href: "#", count: "03", accent: true },
]

const WORKSHOP = [
  { label: "Custom builds", href: "#" },
  { label: "Repairs", href: "#" },
  { label: "Our story", href: "#" },
]

const FOOT = [
  { label: "Sign in", href: "/sign-in" },
  { label: "Contact", href: "#" },
  { label: "Instagram", href: "#" },
]

function MobileMenuPanel() {
  const { isOpen, close } = useMobileMenu()
  const pathname = usePathname()

  return (
    <>
      <div
        className={cn("menu-overlay", isOpen && "open")}
        onClick={close}
        aria-hidden
      />
      <aside
        className={cn("menu-panel", isOpen && "open")}
        aria-hidden={!isOpen}
        aria-label="Menu"
      >
        <div className="menu-head">
          <span className="logo-mark" role="img" aria-label="Dabasberns" />
          <button
            className="close"
            type="button"
            onClick={close}
            aria-label="Close menu"
          >
            ×
          </button>
        </div>

        <div className="menu-body">
          <nav className="menu-primary" aria-label="Primary">
            {PRIMARY_NAV.map((item) => {
              const active = isNavActive(pathname, item.href)
              return (
                <LocalizedLink
                  key={item.label}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={active ? "current" : undefined}
                  onClick={close}
                >
                  {item.label}
                </LocalizedLink>
              )
            })}
          </nav>

          <div className="menu-section">
            <h4>Shop by</h4>
            <ul className="menu-list">
              {SHOP_BY.map((item) => (
                <li key={item.label}>
                  <LocalizedLink
                    href={item.href}
                    onClick={close}
                    style={
                      item.accent ? { color: "var(--accent-deep)" } : undefined
                    }
                  >
                    {item.label} <span className="n">{item.count}</span>
                  </LocalizedLink>
                </li>
              ))}
            </ul>
          </div>

          <div className="menu-section">
            <h4>Workshop</h4>
            <ul className="menu-list">
              {WORKSHOP.map((item) => (
                <li key={item.label}>
                  <LocalizedLink href={item.href} onClick={close}>
                    {item.label}
                  </LocalizedLink>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="menu-foot">
          {FOOT.map((item, i) => (
            <Fragment key={item.label}>
              <LocalizedLink href={item.href} onClick={close}>
                {item.label}
              </LocalizedLink>
              {i < FOOT.length - 1 && <span className="sep">·</span>}
            </Fragment>
          ))}
        </div>
      </aside>
    </>
  )
}
