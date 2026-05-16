import LocalizedLink from "@/modules/common/components/localized-link"
import { notFound } from "next/navigation"

import { AccountNav } from "@/modules/account/components/account-nav"
import { OrderDetail } from "@/modules/account/components/order-detail"
import { retrieveOrder } from "@/lib/data/orders"

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ countryCode: string; id: string }>
}) {
  const { countryCode, id } = await params
  const order = await retrieveOrder(id).catch(() => null)
  if (!order) notFound()

  return (
    <div className="acct-layout">
      <aside className="acct-side" aria-label="Account navigation">
        <AccountNav countryCode={countryCode} />
      </aside>

      <section className="acct-main">
        <span className="eb">Order #{order.display_id}</span>
        <h1>Order detail</h1>

        <OrderDetail order={order} />

        <LocalizedLink href="/account/orders" className="back-link">
          Back to orders
        </LocalizedLink>
      </section>
    </div>
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const order = await retrieveOrder(id).catch(() => null)
  return {
    title: order
      ? `Order #${order.display_id} — Dabasberns`
      : "Order — Dabasberns",
  }
}
