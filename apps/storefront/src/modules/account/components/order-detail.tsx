import { HttpTypes } from "@medusajs/types"
import Image from "next/image"

import { formatPrice } from "@/lib/prices"

type StatusTone = "ok" | "pending" | "canceled"

function deriveStatus(order: HttpTypes.StoreOrder): {
  label: string
  tone: StatusTone
} {
  if (order.status === "canceled")
    return { label: "Canceled", tone: "canceled" }
  const fulfillment = order.fulfillment_status ?? "not_fulfilled"
  if (fulfillment === "delivered") return { label: "Delivered", tone: "ok" }
  if (fulfillment === "shipped" || fulfillment === "partially_shipped")
    return { label: "Shipped", tone: "ok" }
  if (fulfillment === "fulfilled" || fulfillment === "partially_fulfilled")
    return { label: "In workshop", tone: "pending" }
  if (
    order.payment_status === "captured" ||
    order.payment_status === "authorized"
  )
    return { label: "In workshop", tone: "pending" }
  return { label: "Pending", tone: "pending" }
}

function paymentLabel(order: HttpTypes.StoreOrder): string | null {
  const payment = order.payment_collections?.[0]?.payments?.[0]
  if (!payment) return null
  const provider = (payment.provider_id ?? "").replace(/^pp_/, "")
  const pretty = provider
    .split("_")
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ")
  return pretty || null
}

const dateTime = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

export function OrderDetail({ order }: { order: HttpTypes.StoreOrder }) {
  const currency = order.currency_code ?? "eur"
  const items = order.items ?? []
  const ship = order.shipping_address
  const status = deriveStatus(order)
  const payment = paymentLabel(order)

  return (
    <>
      <div className="order-detail-meta">
        <div className="m">
          <span className="k">Placed</span>
          <span className="v">
            {dateTime.format(new Date(order.created_at))}
          </span>
        </div>
        <div className="m">
          <span className="k">Status</span>
          <span
            className={
              status.tone === "ok"
                ? "status"
                : status.tone === "canceled"
                  ? "status canceled"
                  : "status pending"
            }
          >
            {status.label}
          </span>
        </div>
        {payment && (
          <div className="m">
            <span className="k">Payment</span>
            <span className="v">{payment}</span>
          </div>
        )}
        <div className="m">
          <span className="k">Reference</span>
          <span className="v">{order.id}</span>
        </div>
      </div>

      <div className="order-detail-layout">
        <section className="od-items" aria-label="Items in this order">
          {items.map((item) => {
            const unit = item.unit_price ?? 0
            const total = item.total ?? unit * (item.quantity ?? 1)
            const variantTitle =
              item.variant_title && item.variant_title !== "Default"
                ? item.variant_title
                : null
            return (
              <article className="od-item" key={item.id}>
                <div className="thumb">
                  {item.thumbnail ? (
                    <Image
                      src={item.thumbnail}
                      alt={item.product_title ?? ""}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  ) : (
                    <>
                      <div className="ph" />
                      <span className="lbl">
                        {(item.product_title ?? "Item")
                          .slice(0, 2)
                          .toUpperCase()}
                      </span>
                    </>
                  )}
                </div>
                <div className="info">
                  <span className="name">{item.product_title ?? "Item"}</span>
                  <span className="variant">
                    {variantTitle ? `${variantTitle} · ` : ""}× {item.quantity}
                  </span>
                </div>
                <span className="price">{formatPrice(total, currency)}</span>
              </article>
            )
          })}
        </section>

        <aside className="od-summary" aria-label="Order summary">
          <span className="head">Summary</span>

          <div className="row">
            <span className="k">Subtotal</span>
            <span className="v">
              {formatPrice(order.item_subtotal ?? 0, currency)}
            </span>
          </div>
          <div className="row">
            <span className="k">Shipping</span>
            <span className="v">
              {formatPrice(order.shipping_total ?? 0, currency)}
            </span>
          </div>
          {!!order.discount_total && order.discount_total > 0 && (
            <div className="row">
              <span className="k">Discount</span>
              <span className="v">
                − {formatPrice(order.discount_total, currency)}
              </span>
            </div>
          )}
          <div className="row">
            <span className="k">Tax · est.</span>
            <span className="v">
              {order.tax_total && order.tax_total > 0
                ? formatPrice(order.tax_total, currency)
                : "Included"}
            </span>
          </div>
          <div className="row total">
            <span className="k">Total</span>
            <span className="v">{formatPrice(order.total ?? 0, currency)}</span>
          </div>

          {ship && (
            <div className="ship-to">
              <span className="k">Shipping to</span>
              <div className="addr">
                {[ship.first_name, ship.last_name].filter(Boolean).join(" ")}
                <br />
                {ship.address_1}
                {ship.address_2 && (
                  <>
                    <br />
                    {ship.address_2}
                  </>
                )}
                <br />
                {[ship.postal_code, ship.city].filter(Boolean).join(" ")}
                {ship.country_code && (
                  <>
                    <br />
                    {ship.country_code.toUpperCase()}
                  </>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>
    </>
  )
}
