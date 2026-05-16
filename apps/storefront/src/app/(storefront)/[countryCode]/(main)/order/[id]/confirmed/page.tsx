import { HttpTypes } from "@medusajs/types"
import Image from "next/image"
import { notFound } from "next/navigation"

import LocalizedLink from "@/modules/common/components/localized-link"
import { retrieveOrder } from "@/lib/data/orders"
import { formatPrice } from "@/lib/prices"

export const metadata = {
  title: "Order confirmed — Dabasberns",
}

export default async function OrderConfirmedPage({
  params,
}: {
  params: Promise<{ countryCode: string; id: string }>
}) {
  const { id } = await params
  const order = await retrieveOrder(id).catch(() => null)
  if (!order) notFound()

  const currency = order.currency_code ?? "eur"
  const items = order.items ?? []
  const itemCount = items.reduce((sum, it) => sum + (it.quantity ?? 0), 0)
  const ship = order.shipping_address
  const shippingMethod = order.shipping_methods?.[0]
  const paymentProvider =
    order.payment_collections?.[0]?.payments?.[0]?.provider_id ?? null
  const placed = order.created_at
    ? new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(order.created_at))
    : null

  return (
    <main className="shop" data-screen-label="Order confirmed">
      <div className="crumb">
        <LocalizedLink href="/">Dabasberns</LocalizedLink>
        <span className="sep">/</span>
        <span className="now">Order confirmed</span>
      </div>

      <div className="confirm">
        <header className="confirm-hero">
          <span className="eyebrow">Thank you · No. {order.display_id}</span>
          <h1>Your bench is on its way</h1>
          <p className="lede">
            We&apos;ve sent a confirmation to <strong>{order.email}</strong>.
            Anything handmade ships from Kuldīga on the next Tuesday — we cast
            each rod off the dock before it leaves.
          </p>

          <div className="meta-row">
            <div className="cell">
              <span className="k">Order</span>
              <span className="v">No. {order.display_id}</span>
            </div>
            {placed && (
              <div className="cell">
                <span className="k">Placed</span>
                <span className="v">{placed}</span>
              </div>
            )}
            <div className="cell">
              <span className="k">Total paid</span>
              <span className="v">
                {formatPrice(order.total ?? 0, currency)}
              </span>
            </div>
          </div>
        </header>

        <div className="confirm-grid">
          <section>
            <div className="sec-h">
              <h3>In this order</h3>
              <span className="meta">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </span>
            </div>

            <div className="line-items">
              {items.map((item) => (
                <LineItem key={item.id} item={item} currency={currency} />
              ))}
            </div>
          </section>

          <aside>
            <div className="side-rail">
              <div className="detail-card totals">
                <h4>Summary</h4>
                <div className="row">
                  <span className="k">Subtotal</span>
                  <span className="v">
                    {formatPrice(
                      order.item_subtotal ?? order.subtotal ?? 0,
                      currency
                    )}
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
                {!!order.tax_total && order.tax_total > 0 && (
                  <div className="row">
                    <span className="k">Tax</span>
                    <span className="v">
                      {formatPrice(order.tax_total, currency)}
                    </span>
                  </div>
                )}
                <div className="row total">
                  <span className="k">Total</span>
                  <span className="v">
                    {formatPrice(order.total ?? 0, currency)}
                  </span>
                </div>
              </div>

              {ship && (
                <div className="detail-card">
                  <h4>Shipping to</h4>
                  <div className="body">
                    {[ship.first_name, ship.last_name]
                      .filter(Boolean)
                      .join(" ")}
                    <br />
                    {ship.address_1}
                    {ship.address_2 ? (
                      <>
                        <br />
                        {ship.address_2}
                      </>
                    ) : null}
                    <br />
                    {[ship.postal_code, ship.city].filter(Boolean).join(" ")}
                    {ship.country_code
                      ? `, ${ship.country_code.toUpperCase()}`
                      : ""}
                  </div>
                </div>
              )}

              {shippingMethod && (
                <div className="detail-card">
                  <h4>Delivery</h4>
                  <div className="body">
                    {shippingMethod.name}
                    {shippingMethod.description ? (
                      <>
                        <br />
                        <span className="muted">
                          {shippingMethod.description}
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>
              )}

              {paymentProvider && (
                <div className="detail-card">
                  <h4>Payment</h4>
                  <div className="body">
                    <span className="pay-method">
                      <span className="dot" />
                      Paid via{" "}
                      <span className="provider">
                        {formatProvider(paymentProvider)}
                      </span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>

        <div className="confirm-actions">
          <LocalizedLink href="/account/orders" className="btn primary">
            <span>See all orders</span>
            <span>→</span>
          </LocalizedLink>
          <LocalizedLink href="/products" className="btn ghost">
            <span>Keep browsing</span>
            <span>→</span>
          </LocalizedLink>
        </div>
      </div>
    </main>
  )
}

function LineItem({
  item,
  currency,
}: {
  item: HttpTypes.StoreOrderLineItem
  currency: string
}) {
  const lineTotal = item.total ?? (item.unit_price ?? 0) * (item.quantity ?? 1)
  const variantLabel =
    item.variant_title && item.variant_title !== "Default"
      ? item.variant_title
      : null

  return (
    <div className="li">
      <div className="thumb">
        {item.thumbnail ? (
          <Image
            src={item.thumbnail}
            alt={item.product_title ?? ""}
            fill
            sizes="88px"
            className="object-cover"
          />
        ) : (
          <div className="ph" />
        )}
      </div>
      <div className="info">
        <span className="name">{item.product_title}</span>
        <span className="variant">
          {variantLabel ?? <span>&nbsp;</span>}
          <span className="qty">Qty {item.quantity}</span>
        </span>
      </div>
      <span className="amt">{formatPrice(lineTotal, currency)}</span>
    </div>
  )
}

function formatProvider(id: string): string {
  const cleaned = id.replace(/^pp_/, "").split("_")[0]
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}
