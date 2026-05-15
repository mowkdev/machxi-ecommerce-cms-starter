import LocalizedLink from "@/modules/common/components/localized-link"
import { redirect } from "next/navigation"

import { CheckoutFlow } from "@/modules/checkout/components/checkout-flow"
import { CheckoutSummary } from "@/modules/checkout/components/checkout-summary"
import { retrieveCart } from "@/lib/data/cart"
import { retrieveCustomer } from "@/lib/data/customer"
import { listCartShippingMethods } from "@/lib/data/fulfillment"
import { listCartPaymentMethods } from "@/lib/data/payment"
import {
  CHECKOUT_STEPS,
  STEP_LABEL,
  type CheckoutStep,
} from "@/lib/checkout/schemas"

export const metadata = {
  title: "Checkout — Dabasberns",
}

function inferStep(
  cart: Awaited<ReturnType<typeof retrieveCart>>
): CheckoutStep {
  if (!cart) return "address"
  if (!cart.shipping_address?.address_1) return "address"
  if (!cart.shipping_methods || cart.shipping_methods.length === 0)
    return "delivery"
  const session = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )
  if (!session) return "payment"
  return "review"
}

function isStep(value: string | undefined): value is CheckoutStep {
  return !!value && (CHECKOUT_STEPS as readonly string[]).includes(value)
}

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ step?: string }>
}) {
  const { countryCode } = await params
  const { step: stepParam } = await searchParams

  const cart = await retrieveCart()
  if (!cart || (cart.items ?? []).length === 0) {
    redirect(`/${countryCode}/cart`)
  }

  const customer = await retrieveCustomer()
  const shipping = (await listCartShippingMethods(cart.id)) ?? []
  const payment = cart.region?.id
    ? ((await listCartPaymentMethods(cart.region.id)) ?? [])
    : []

  const initialStep: CheckoutStep = isStep(stepParam)
    ? stepParam
    : inferStep(cart)
  const stepIndex = CHECKOUT_STEPS.indexOf(initialStep)

  return (
    <main className="shop shop-checkout" data-screen-label="Checkout">
      <div className="crumb">
        <LocalizedLink href="/">Dabasberns</LocalizedLink>
        <span className="sep">/</span>
        <LocalizedLink href="/cart">Cart</LocalizedLink>
        <span className="sep">/</span>
        <span className="now">Checkout</span>
      </div>

      <header className="shop-head">
        <div>
          <span className="eyebrow">
            Step {String(stepIndex + 1).padStart(2, "0")} of 04 ·{" "}
            {STEP_LABEL[initialStep]}
          </span>
          <h1>Checkout</h1>
        </div>
        <p className="lede">
          Address, then delivery, then payment. We don&apos;t store card details
          — payment is handled by Stripe. Order is reviewed before any charge is
          made.
        </p>
      </header>

      <div className="checkout-layout">
        <CheckoutFlow
          cart={cart}
          customer={customer}
          shippingMethods={shipping}
          paymentProviders={payment}
          countryCode={countryCode}
          initialStep={initialStep}
        />
        <CheckoutSummary cart={cart} />
      </div>
    </main>
  )
}
