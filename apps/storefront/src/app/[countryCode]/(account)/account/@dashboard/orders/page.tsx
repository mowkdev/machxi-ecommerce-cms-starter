import LocalizedLink from "@/modules/common/components/localized-link"

import { AccountNav } from "@/modules/account/components/account-nav"
import { formatPrice } from "@/lib/prices"
import { listOrders } from "@/lib/data/orders"

export const metadata = { title: "Orders — Dabasberns" }

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await params
  const orders = (await listOrders(50).catch(() => [])) ?? []

  return (
    <div className="acct-layout">
      <aside className="acct-side" aria-label="Account navigation">
        <AccountNav countryCode={countryCode} />
      </aside>

      <section className="acct-main">
        <span className="eb">Orders</span>
        <h1>Order history</h1>
        <p className="lede">
          Everything you&apos;ve sent through the workshop. Open an order to
          track its current status, see the items in detail, or download an
          invoice.
        </p>

        {orders.length === 0 ? (
          <div className="empty-state">
            <h3>No orders yet</h3>
            <p>When you place one it&apos;ll show here.</p>
            <LocalizedLink href="/products" className="btn-secondary">
              Browse the workshop →
            </LocalizedLink>
          </div>
        ) : (
          <div className="order-list">
            {orders.map((order) => {
              const items = order.items ?? []
              const headline = items
                .slice(0, 2)
                .map((it) => it.product_title)
                .filter(Boolean)
                .join(" · ")
              const totalQty = items.reduce(
                (sum, it) => sum + (it.quantity ?? 0),
                0
              )
              const sub = `${items.length} ${
                items.length === 1 ? "line" : "lines"
              } · ${totalQty} ${totalQty === 1 ? "item" : "items"}`
              return (
                <article className="order-row" key={order.id}>
                  <span className="ord-n">#{order.display_id}</span>
                  <div className="ord-items">
                    {headline || "Order"}
                    <span className="sub">{sub}</span>
                  </div>
                  <span className="ord-date">
                    {new Date(order.created_at).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <span className="ord-total">
                    {formatPrice(
                      order.total ?? 0,
                      order.currency_code ?? "eur"
                    )}
                  </span>
                  <LocalizedLink
                    href={`/account/orders/details/${order.id}`}
                    className="ord-view"
                  >
                    Details<span>→</span>
                  </LocalizedLink>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
