import LocalizedLink from "@/modules/common/components/localized-link"

import { AccountNav } from "@/modules/account/components/account-nav"
import { formatPrice } from "@/lib/prices"
import { listOrders } from "@/lib/data/orders"
import { retrieveCustomer } from "@/lib/data/customer"

export default async function DashboardPage() {
  const customer = await retrieveCustomer()
  if (!customer) return null

  const orders = (await listOrders(3).catch(() => [])) ?? []
  const totalOrders = orders.length
  const savedAddresses = customer.addresses?.length ?? 0
  const displayName = customer.first_name?.trim() || "Friend"

  return (
    <div className="acct-layout">
      <aside className="acct-side" aria-label="Account navigation">
        <AccountNav />
      </aside>

      <section className="acct-main">
        <span className="eb">Welcome</span>
        <h1>{displayName}</h1>
        <p className="lede">
          Signed in as <strong>{customer.email}</strong>. From here you can keep
          your bench in order — profile, addresses, orders, and the small
          details we ask about at checkout.
        </p>

        <div className="acct-stats">
          <LocalizedLink href="/account/orders" className="acct-stat">
            <span className="k">Orders</span>
            <span className="v">{totalOrders}</span>
            <span className="link">View order history →</span>
          </LocalizedLink>
          <LocalizedLink href="/account/addresses" className="acct-stat">
            <span className="k">Saved addresses</span>
            <span className="v">{savedAddresses}</span>
            <span className="link">Manage address book →</span>
          </LocalizedLink>
        </div>

        <header className="acct-section-head">
          <h2>Recent orders</h2>
          <LocalizedLink href="/account/orders" className="link">
            See all →
          </LocalizedLink>
        </header>

        {orders.length === 0 ? (
          <div className="empty-state">
            <h3>No orders yet</h3>
            <p>
              When you place an order it will show up here with status,
              shipping, and an invoice you can download.
            </p>
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
                    View<span>→</span>
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
