"use client"

import { HttpTypes } from "@medusajs/types"

import { CHECKOUT_STEPS, type CheckoutStep } from "@/lib/checkout/schemas"

import { useCheckoutNavigation } from "./shared/use-checkout-navigation"
import { Stepper } from "./shared/stepper"
import { AddressStep } from "./steps/address-step"
import { DeliveryStep } from "./steps/delivery-step"
import { PaymentStep } from "./steps/payment-step"
import { ReviewStep } from "./steps/review-step"
import type { StepState } from "./shared/step-card"

type CheckoutFlowProps = {
  cart: HttpTypes.StoreCart
  customer: HttpTypes.StoreCustomer | null
  shippingMethods: HttpTypes.StoreCartShippingOption[]
  paymentProviders: HttpTypes.StorePaymentProvider[]
  countryCode: string
  initialStep: CheckoutStep
}

export function CheckoutFlow({
  cart,
  customer,
  shippingMethods,
  paymentProviders,
  countryCode,
  initialStep,
}: CheckoutFlowProps) {
  const nav = useCheckoutNavigation(initialStep)

  const stateOf = (step: CheckoutStep): StepState => {
    if (nav.isActive(step)) return "active"
    if (nav.isDone(step)) return "done"
    return "pending"
  }

  const nextOf = (step: CheckoutStep): CheckoutStep | null => {
    const idx = CHECKOUT_STEPS.indexOf(step)
    return CHECKOUT_STEPS[idx + 1] ?? null
  }

  const handleCompleted = (step: CheckoutStep) => {
    const next = nextOf(step)
    nav.refresh()
    if (next) nav.goTo(next, { scroll: true })
  }

  return (
    <section className="checkout-main">
      <Stepper
        current={nav.current}
        isDone={nav.isDone}
        onSelect={(step) => nav.goTo(step, { scroll: true })}
      />

      <AddressStep
        cart={cart}
        customer={customer}
        countryCode={countryCode}
        state={stateOf("address")}
        onEdit={() => nav.goTo("address", { scroll: true })}
        onCompleted={() => handleCompleted("address")}
      />

      <DeliveryStep
        cart={cart}
        methods={shippingMethods}
        state={stateOf("delivery")}
        onEdit={() => nav.goTo("delivery", { scroll: true })}
        onCompleted={() => handleCompleted("delivery")}
      />

      <PaymentStep
        cart={cart}
        providers={paymentProviders}
        state={stateOf("payment")}
        onEdit={() => nav.goTo("payment", { scroll: true })}
        onCompleted={() => handleCompleted("payment")}
      />

      <ReviewStep cart={cart} state={stateOf("review")} />
    </section>
  )
}
