import { HttpTypes } from "@medusajs/types"
import Image from "next/image"

import { formatPrice } from "@/lib/prices"

export function CheckoutSummary({ cart }: { cart: HttpTypes.StoreCart }) {
  const currency = cart.currency_code ?? "eur"
  const items = cart.items ?? []

  return (
    <aside className="summary" aria-label="Order summary">
      <div className="head">
        <span className="eb">Your bench</span>
      </div>

      <div className="mini-items">
        {items.map((item) => (
          <MiniItem
            key={item.id}
            title={item.product_title ?? item.title ?? "Product"}
            variant={
              item.variant_title && item.variant_title !== "Default"
                ? item.variant_title
                : null
            }
            quantity={item.quantity}
            thumbnail={item.thumbnail ?? null}
            total={formatPrice(
              item.total ?? (item.unit_price ?? 0) * item.quantity,
              currency
            )}
          />
        ))}
      </div>

      <hr />

      <div className="row">
        <span className="k">Subtotal</span>
        <span className="v">
          {formatPrice(cart.item_subtotal ?? 0, currency)}
        </span>
      </div>
      <div className="row">
        <span className="k">Shipping</span>
        <span className={`v${cart.shipping_total ? "" : " muted"}`}>
          {cart.shipping_total
            ? formatPrice(cart.shipping_total, currency)
            : "Calculated next"}
        </span>
      </div>
      {!!cart.discount_total && cart.discount_total > 0 && (
        <div className="row">
          <span className="k">Discount</span>
          <span className="v">
            − {formatPrice(cart.discount_total, currency)}
          </span>
        </div>
      )}
      {!!cart.tax_total && cart.tax_total > 0 ? (
        <div className="row">
          <span className="k">Tax</span>
          <span className="v">{formatPrice(cart.tax_total, currency)}</span>
        </div>
      ) : (
        <div className="row">
          <span className="k">Tax · est.</span>
          <span className="v muted">Included</span>
        </div>
      )}

      <div className="row total">
        <span className="k">Total</span>
        <span className="v">
          {formatPrice(cart.total ?? cart.item_subtotal ?? 0, currency)}
        </span>
      </div>

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
          Stripe secure checkout
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
      </div>
    </aside>
  )
}

function MiniItem({
  title,
  variant,
  quantity,
  thumbnail,
  total,
}: {
  title: string
  variant: string | null
  quantity: number
  thumbnail: string | null
  total: string
}) {
  return (
    <div className="mini-item">
      <div className="thumb">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={title}
            fill
            sizes="64px"
            className="object-cover"
          />
        ) : (
          <span className="ph" />
        )}
        <span className="qbadge">{quantity}</span>
      </div>
      <div className="info">
        <span className="name">{title}</span>
        {variant && <span className="variant">{variant}</span>}
      </div>
      <span className="price">{total}</span>
    </div>
  )
}
