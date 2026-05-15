"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { HttpTypes } from "@medusajs/types"
import { useState, useTransition } from "react"
import { Controller, useForm } from "react-hook-form"

import { RadioGroup } from "@/modules/common/ui/radio-group"
import { initiatePaymentSession } from "@/lib/data/cart"
import {
  isCardProvider,
  paymentSchema,
  type PaymentFormValues,
} from "@/lib/checkout/schemas"

import { ControlledField } from "../shared/field"
import { RadioCard } from "../shared/radio-card"
import { StepCard } from "../shared/step-card"
import { SummaryCell, SummaryRow } from "../shared/summary-row"
import type { StepState } from "../shared/step-card"

type PaymentStepProps = {
  cart: HttpTypes.StoreCart
  providers: HttpTypes.StorePaymentProvider[]
  state: StepState
  onEdit: () => void
  onCompleted: () => void
}

export function PaymentStep(props: PaymentStepProps) {
  return (
    <StepCard
      step="payment"
      state={props.state}
      number={3}
      title="Payment"
      onEdit={props.onEdit}
      active={<PaymentActive {...props} />}
      done={<PaymentDone cart={props.cart} />}
    />
  )
}

function describeProvider(id: string): {
  title: string
  desc: string
  icons: string[]
} {
  if (/stripe|card/i.test(id)) {
    return {
      title: "Credit card",
      desc: "Visa, Mastercard, Amex · processed by Stripe",
      icons: ["Visa", "MC", "Amex"],
    }
  }
  if (/paypal/i.test(id)) {
    return {
      title: "PayPal",
      desc: "You'll be redirected after review",
      icons: ["Pay"],
    }
  }
  if (/sepa|bank/i.test(id)) {
    return {
      title: "Bank transfer",
      desc: "SEPA · order ships when payment lands (2–3 days)",
      icons: ["SEPA"],
    }
  }
  return {
    title: id.replace(/^pp_/, "").replace(/_/g, " "),
    desc: "",
    icons: [],
  }
}

function PaymentActive({ cart, providers, onCompleted }: PaymentStepProps) {
  const [pending, startTransition] = useTransition()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const activeSession = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      provider_id: activeSession?.provider_id ?? providers[0]?.id ?? "",
      card_number: "",
      card_expiry: "",
      card_cvc: "",
      card_name: "",
    },
  })

  const providerId = form.watch("provider_id")
  const showCardFields = !!providerId && isCardProvider(providerId)

  const onSubmit = form.handleSubmit((values) => {
    setSubmitError(null)
    startTransition(async () => {
      try {
        await initiatePaymentSession(cart, { provider_id: values.provider_id })
        onCompleted()
      } catch (e) {
        setSubmitError(
          e instanceof Error ? e.message : "Could not start payment"
        )
      }
    })
  })

  return (
    <form noValidate onSubmit={onSubmit}>
      {providers.length === 0 ? (
        <p className="text-[14px] text-[var(--ink-soft)]">
          No payment methods available for this region.
        </p>
      ) : (
        <Controller
          control={form.control}
          name="provider_id"
          render={({ field }) => (
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              aria-label="Payment method"
            >
              {providers.map((p) => {
                const info = describeProvider(p.id)
                const isPaypal = /paypal/i.test(p.id)
                return (
                  <RadioCard
                    key={p.id}
                    value={p.id}
                    selected={field.value === p.id}
                    title={info.title}
                    description={info.desc}
                    right={
                      info.icons.length > 0 ? (
                        <span className="pay-icons">
                          {info.icons.map((icon) => (
                            <span
                              key={icon}
                              className={`pay-icon${isPaypal ? " paypal" : ""}`}
                            >
                              {icon}
                            </span>
                          ))}
                        </span>
                      ) : null
                    }
                  />
                )
              })}
            </RadioGroup>
          )}
        />
      )}

      {showCardFields && (
        <div className="card-fields">
          <ControlledField
            control={form.control}
            name="card_number"
            label="Card number"
            full
            inputProps={{
              inputMode: "numeric",
              autoComplete: "cc-number",
              placeholder: "1234 1234 1234 1234",
            }}
          />
          <ControlledField
            control={form.control}
            name="card_expiry"
            label="Expiry"
            inputProps={{
              inputMode: "numeric",
              autoComplete: "cc-exp",
              placeholder: "MM / YY",
            }}
          />
          <ControlledField
            control={form.control}
            name="card_cvc"
            label="CVC"
            inputProps={{
              inputMode: "numeric",
              autoComplete: "cc-csc",
              placeholder: "123",
            }}
          />
          <ControlledField
            control={form.control}
            name="card_name"
            label="Name on card"
            full
            inputProps={{
              autoComplete: "cc-name",
              placeholder: "As written on the card",
            }}
          />
        </div>
      )}

      {submitError && (
        <p className="err" style={{ marginTop: 14 }}>
          {submitError}
        </p>
      )}

      <button
        type="submit"
        className="continue"
        disabled={pending || providers.length === 0}
      >
        <span>{pending ? "Preparing…" : "Continue to review"}</span>
        <span>→</span>
      </button>
    </form>
  )
}

function PaymentDone({ cart }: { cart: HttpTypes.StoreCart }) {
  const session = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )
  if (!session) return null
  const info = describeProvider(session.provider_id)
  return (
    <SummaryRow>
      <SummaryCell label="Method">{info.title}</SummaryCell>
      <SummaryCell label="Billing">Same as shipping</SummaryCell>
    </SummaryRow>
  )
}
