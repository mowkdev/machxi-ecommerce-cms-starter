import LocalizedLink from "@/modules/common/components/localized-link"

import { CartView } from "@/modules/cart/components/cart-view"
import { retrieveCustomer } from "@/lib/data/customer"

export const metadata = {
  title: "Your bench — Dabasberns",
}

export default async function CartPage({
  params,
}: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await params
  const customer = await retrieveCustomer()

  return (
    <main className="shop shop-checkout" data-screen-label="Cart">
      <div className="crumb">
        <LocalizedLink href="/">Dabasberns</LocalizedLink>
        <span className="sep">/</span>
        <span className="now">Your bench</span>
      </div>

      <CartView
        countryCode={countryCode}
        customerEmail={customer?.email ?? null}
      />
    </main>
  )
}
