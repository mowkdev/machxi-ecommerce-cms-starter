"use client"

import LocalizedLink from "@/modules/common/components/localized-link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

import { cn } from "@/lib/utils"
import { useCart } from "@/modules/cart/components/cart-provider"
import { formatPrice } from "@/lib/prices"

type CartUiContextValue = {
  isOpen: boolean
  open: () => void
  close: () => void
}

const CartUiContext = createContext<CartUiContextValue | null>(null)

export function CartUiProvider({ children }: { children: React.ReactNode }) {
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
    <CartUiContext.Provider value={value}>
      {children}
      <CartPanel />
    </CartUiContext.Provider>
  )
}

export function useCartUi(): CartUiContextValue {
  const ctx = useContext(CartUiContext)
  if (!ctx) {
    throw new Error("useCartUi must be used inside <CartUiProvider>")
  }
  return ctx
}

function CartPanel() {
  const router = useRouter()
  const { isOpen, close } = useCartUi()
  const {
    cart,
    loading,
    itemCount,
    subtotal,
    currencyCode,
    updateItem,
    removeItem,
  } = useCart()

  const items = cart?.items ?? []
  const goToCheckout = () => {
    close()
    router.push("/cart")
  }

  return (
    <>
      <div
        className={cn("cart-overlay", isOpen && "open")}
        onClick={close}
        aria-hidden
      />
      <aside
        className={cn("cart-panel", isOpen && "open")}
        aria-hidden={!isOpen}
        aria-label="Cart"
      >
        <div className="cart-head">
          <h2>
            Your bench{" "}
            <span className="cnt">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </span>
          </h2>
          <button
            className="close"
            type="button"
            onClick={close}
            aria-label="Close cart"
          >
            ×
          </button>
        </div>

        <div className="cart-items">
          {loading && (
            <div style={{ padding: "2rem", textAlign: "center", opacity: 0.5 }}>
              Loading…
            </div>
          )}
          {!loading && items.length === 0 && (
            <div style={{ padding: "2rem", textAlign: "center", opacity: 0.5 }}>
              Your bench is empty
            </div>
          )}
          {items.map((item) => {
            const handle = item.product_handle ?? "#"
            const title = item.product_title ?? item.title ?? "Product"
            const unitPriceFormatted = formatPrice(
              item.unit_price ?? 0,
              currencyCode
            )

            return (
              <div key={item.id} className="cart-item">
                <LocalizedLink
                  href={`/products/${handle}`}
                  onClick={close}
                  className="thumb"
                  aria-label={title}
                >
                  {item.thumbnail ? (
                    <Image
                      src={item.thumbnail}
                      alt={title}
                      fill
                      sizes="84px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="ph" />
                  )}
                  <span className="lbl">{item.variant_sku ?? ""}</span>
                </LocalizedLink>
                <div className="info">
                  <div className="row">
                    <LocalizedLink
                      href={`/products/${handle}`}
                      onClick={close}
                      className="name"
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      {title}
                    </LocalizedLink>
                    <span className="price">{unitPriceFormatted}</span>
                  </div>
                  {item.variant_title && item.variant_title !== "Default" && (
                    <div className="meta">{item.variant_title}</div>
                  )}
                  <div className="row">
                    <div className="qty-mini">
                      <button
                        type="button"
                        aria-label="Decrease"
                        onClick={() => {
                          if (item.quantity <= 1) {
                            removeItem(item.id)
                          } else {
                            updateItem(item.id, item.quantity - 1)
                          }
                        }}
                      >
                        −
                      </button>
                      <span className="v">{item.quantity}</span>
                      <button
                        type="button"
                        aria-label="Increase"
                        onClick={() => updateItem(item.id, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <button
                      className="rm"
                      type="button"
                      onClick={() => removeItem(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="cart-totals">
          <div className="row">
            <span className="k">Shipping</span>
            <span className="v">Calculated next</span>
          </div>
          <div className="row subtotal">
            <span className="k">Subtotal</span>
            <span className="v">{subtotal}</span>
          </div>
          <p className="ship-note">
            Ships Tuesday from Kuldīga, Latvia. Tracked, signed for.
          </p>
          <button
            className="checkout"
            type="button"
            onClick={goToCheckout}
            disabled={items.length === 0}
          >
            <span>Go to checkout</span>
            <span>→</span>
          </button>
          <a
            className="cont"
            href="#"
            onClick={(e) => {
              e.preventDefault()
              close()
            }}
          >
            Continue browsing
          </a>
        </div>
      </aside>
    </>
  )
}
