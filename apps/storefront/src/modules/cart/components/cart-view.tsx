"use client"

import { useRouter } from "next/navigation"
import Image from "next/image"
import { HttpTypes } from "@medusajs/types"

import LocalizedLink from "@/modules/common/components/localized-link"
import { PromoForm } from "@/modules/cart/components/promo-form"
import { useCart } from "@/modules/cart/components/cart-provider"
import { formatPrice } from "@/lib/prices"

export function CartView({
  customerEmail,
}: {
  customerEmail: string | null
}) {
  const router = useRouter()
  const { cart, currencyCode, subtotal, updateItem, removeItem } = useCart()

  const items = cart?.items ?? []
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  if (items.length === 0) {
    return (
      <div className="cart-empty-large">
        <span className="icon" aria-hidden>
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 7h14l-1.4 11a2 2 0 0 1-2 1.8H8.4a2 2 0 0 1-2-1.8L5 7z" />
            <path d="M9 7V5.5a3 3 0 0 1 6 0V7" />
          </svg>
        </span>
        <h3>Empty bench</h3>
        <p>
          Nothing on the bench just yet. Browse the rods, reels and quieter
          things from the workshop.
        </p>
        <LocalizedLink
          href="/products"
          className="cta-checkout"
          style={{ marginTop: 14, minWidth: 240 }}
        >
          <span>Browse the workshop</span>
          <span>→</span>
        </LocalizedLink>
      </div>
    )
  }

  const goToCheckout = () => router.push("/checkout")
  const promoCodes = (cart?.promotions ?? []).map((p) => p.code ?? "")

  return (
    <>
      <header className="shop-head">
        <div>
          <span className="eyebrow">
            {itemCount} {itemCount === 1 ? "item" : "items"} on the bench
          </span>
          <h1>Your bench</h1>
        </div>
        <p className="lede">
          Take a last look before we wrap things. Items stay here for 7 days.
          Shipping is calculated at checkout once we know where you&apos;re
          casting from.
        </p>
      </header>

      <div className="cart-layout">
        <section className="cart-items-col">
          <div className="cart-items-list">
            {items.map((item) => (
              <LineRow
                key={item.id}
                item={item}
                currencyCode={currencyCode}
                onIncrease={() => updateItem(item.id, item.quantity + 1)}
                onDecrease={() =>
                  item.quantity <= 1
                    ? removeItem(item.id)
                    : updateItem(item.id, item.quantity - 1)
                }
                onRemove={() => removeItem(item.id)}
              />
            ))}
          </div>

          <div className="cart-foot">
            <LocalizedLink href="/products" className="keep">
              <span>←</span> Keep browsing
            </LocalizedLink>
            {cart?.shipping_address?.city && (
              <span className="est">
                Ships from Kuldīga, LV · to {cart.shipping_address.city}
              </span>
            )}
          </div>
        </section>

        <aside className="summary" aria-label="Order summary">
          <div className="head">
            <span className="eb">Summary</span>
          </div>

          <div className="row">
            <span className="k">
              Subtotal · {itemCount} {itemCount === 1 ? "item" : "items"}
            </span>
            <span className="v">{subtotal}</span>
          </div>
          <div className="row">
            <span className="k">Shipping</span>
            <span className="v muted">Calculated next</span>
          </div>
          <div className="row">
            <span className="k">Estimated tax</span>
            <span className="v muted">Calculated next</span>
          </div>
          {!!cart?.discount_total && cart.discount_total > 0 && (
            <div className="row">
              <span className="k">Discount</span>
              <span className="v">
                − {formatPrice(cart.discount_total, currencyCode)}
              </span>
            </div>
          )}

          <div className="row total">
            <span className="k">Total</span>
            <span className="v">
              {formatPrice(
                cart?.total ?? cart?.item_subtotal ?? 0,
                currencyCode
              )}
            </span>
          </div>

          <PromoForm currentCodes={promoCodes} />

          <button type="button" className="cta-checkout" onClick={goToCheckout}>
            <span>Go to checkout</span>
            <span>→</span>
          </button>

          <p className="signin-hint">
            {customerEmail ? (
              <>Signed in as {customerEmail}.</>
            ) : (
              <>
                Have an account?{" "}
                <LocalizedLink href="/sign-in">Sign in</LocalizedLink> to use
                saved addresses.
              </>
            )}
          </p>

          <div className="reassure">
            <div className="r">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4z" />
              </svg>
              Secure SSL · Stripe + PayPal
            </div>
            <div className="r">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 7h13l2 4h3v5h-2" />
                <circle cx="7" cy="17" r="2" />
                <circle cx="17" cy="17" r="2" />
              </svg>
              Free returns within 30 days
            </div>
            <div className="r">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 6v6l4 2" />
                <circle cx="12" cy="12" r="9" />
              </svg>
              Hand-cast &amp; signed before shipping
            </div>
          </div>
        </aside>
      </div>
    </>
  )
}

function LineRow({
  item,
  currencyCode,
  onIncrease,
  onDecrease,
  onRemove,
}: {
  item: HttpTypes.StoreCartLineItem
  currencyCode: string
  onIncrease: () => void
  onDecrease: () => void
  onRemove: () => void
}) {
  const title = item.product_title ?? item.title ?? "Product"
  const variantTitle =
    item.variant_title && item.variant_title !== "Default"
      ? item.variant_title
      : null
  const productHref = `/products/${item.product_handle ?? "#"}`
  const lineTotal = formatPrice(
    item.total ?? (item.unit_price ?? 0) * item.quantity,
    currencyCode
  )
  const unitPrice = formatPrice(item.unit_price ?? 0, currencyCode)

  return (
    <article className="line-item">
      <LocalizedLink href={productHref} className="thumb" aria-label={title}>
        {item.thumbnail ? (
          <Image
            src={item.thumbnail}
            alt={title}
            fill
            sizes="132px"
            className="object-cover"
          />
        ) : (
          <span className="ph" />
        )}
        {item.variant_sku && <span className="lbl">{item.variant_sku}</span>}
      </LocalizedLink>

      <div className="info">
        <LocalizedLink href={productHref} className="name">
          {title}
        </LocalizedLink>
        {variantTitle && <span className="variant">{variantTitle}</span>}
        <div className="controls">
          <div className="qty">
            <button type="button" aria-label="Decrease" onClick={onDecrease}>
              −
            </button>
            <span className="v">{item.quantity}</span>
            <button type="button" aria-label="Increase" onClick={onIncrease}>
              +
            </button>
          </div>
          <button type="button" className="rm" onClick={onRemove}>
            Remove
          </button>
        </div>
      </div>

      <div className="price-col">
        {lineTotal}
        {item.quantity > 1 && <span className="each">{unitPrice} each</span>}
      </div>
    </article>
  )
}
