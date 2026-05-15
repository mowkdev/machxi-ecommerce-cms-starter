"use client"

import { cn } from "@/lib/utils"
import LocalizedLink from "@/modules/common/components/localized-link"
import { ThemeToggle } from "@/modules/layout/components/theme-toggle"
import { useCartUi } from "@/modules/cart/components/cart-panel"

export type MinimalShellVariant = "checkout" | "account"

export function CheckoutHeader({
  variant = "checkout",
  centerLabel,
  backHref = "/products",
  backLabel = "Continue shopping",
}: {
  variant?: MinimalShellVariant
  centerLabel?: string
  backHref?: string
  backLabel?: string
}) {
  const resolvedCenter =
    centerLabel ?? (variant === "account" ? "Account" : "Your bench")

  return (
    <header
      className={cn("nav-checkout", variant === "account" && "nav-account")}
      data-screen-label="Nav"
    >
      <div className="left">
        <LocalizedLink
          href="/"
          className="brand"
          aria-label="Dabasberns — home"
        >
          <span className="logo-mark" role="img" aria-label="Dabasberns" />
        </LocalizedLink>
        <LocalizedLink href={backHref} className="back">
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 3L5 8l5 5" />
          </svg>
          {backLabel}
        </LocalizedLink>
      </div>
      <div className="center">{resolvedCenter}</div>
      <div className="right">
        {variant === "checkout" ? (
          <>
            <span className="secure">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="4" y="10" width="16" height="10" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
              Secure cart
            </span>
            <LocalizedLink href="/account" className="help">
              Help?
            </LocalizedLink>
            <ThemeToggle />
            <LocalizedLink
              href="/account"
              className="icon-btn"
              aria-label="Account"
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
          </>
        ) : (
          <>
            <ThemeToggle />
            <CartIconButton />
          </>
        )}
      </div>
    </header>
  )
}

function CartIconButton() {
  const { open } = useCartUi()
  return (
    <button type="button" className="icon-btn" aria-label="Cart" onClick={open}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 6h14l-1.4 11.2A2 2 0 0 1 15.6 19H8.4a2 2 0 0 1-2-1.8L5 6z" />
        <path d="M9 6V4.5a3 3 0 0 1 6 0V6" />
      </svg>
    </button>
  )
}

export function CheckoutFooter() {
  return (
    <footer className="footer-checkout" data-screen-label="Footer">
      <div className="left">
        <span className="logo-mark" role="img" aria-label="Dabasberns" />
        <span>© 2026 Dabasberns SIA</span>
      </div>
      <nav className="links" aria-label="Help">
        <LocalizedLink href="/account">Help</LocalizedLink>
        <LocalizedLink href="/account">Shipping</LocalizedLink>
        <LocalizedLink href="/account">Returns</LocalizedLink>
        <LocalizedLink href="/account">Contact</LocalizedLink>
        <LocalizedLink href="/account">Privacy</LocalizedLink>
        <LocalizedLink href="/account">Terms</LocalizedLink>
      </nav>
    </footer>
  )
}

export function MinimalShell({
  variant = "checkout",
  children,
}: {
  variant?: MinimalShellVariant
  children: React.ReactNode
}) {
  return (
    <div className="checkout-shell">
      <CheckoutHeader variant={variant} />
      <div className="checkout-shell-body">{children}</div>
      <CheckoutFooter />
    </div>
  )
}
