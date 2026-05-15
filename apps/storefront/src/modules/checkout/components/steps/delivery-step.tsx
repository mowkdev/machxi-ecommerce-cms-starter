"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { HttpTypes } from "@medusajs/types"
import { useState, useTransition } from "react"
import { Controller, useForm } from "react-hook-form"

import { RadioGroup } from "@/modules/common/ui/radio-group"
import { setShippingMethod } from "@/lib/data/cart"
import { deliverySchema, type DeliveryFormValues } from "@/lib/checkout/schemas"
import { formatPrice } from "@/lib/prices"

import { RadioCard } from "../shared/radio-card"
import { StepCard } from "../shared/step-card"
import { SummaryCell, SummaryRow } from "../shared/summary-row"
import type { StepState } from "../shared/step-card"

type DeliveryStepProps = {
  cart: HttpTypes.StoreCart
  methods: HttpTypes.StoreCartShippingOption[]
  state: StepState
  onEdit: () => void
  onCompleted: () => void
}

export function DeliveryStep(props: DeliveryStepProps) {
  return (
    <StepCard
      step="delivery"
      state={props.state}
      number={2}
      title="Delivery"
      onEdit={props.onEdit}
      active={<DeliveryActive {...props} />}
      done={<DeliveryDone cart={props.cart} />}
    />
  )
}

function describeMethod(method: HttpTypes.StoreCartShippingOption): string {
  // Use Medusa metadata `description` when present, otherwise fall back to provider id.
  const meta = (method as { data?: Record<string, unknown> }).data
  const desc =
    (typeof meta?.description === "string" && meta.description) ||
    method.provider_id ||
    "Tracked & signed"
  return String(desc)
}

function DeliveryActive({ cart, methods, onCompleted }: DeliveryStepProps) {
  const [pending, startTransition] = useTransition()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const currency = cart.currency_code ?? "eur"

  const form = useForm<DeliveryFormValues>({
    resolver: zodResolver(deliverySchema),
    defaultValues: {
      shipping_option_id:
        cart.shipping_methods?.[0]?.shipping_option_id ?? methods[0]?.id ?? "",
    },
  })

  const onSubmit = form.handleSubmit((values) => {
    setSubmitError(null)
    startTransition(async () => {
      try {
        await setShippingMethod({
          cartId: cart.id,
          shippingMethodId: values.shipping_option_id,
        })
        onCompleted()
      } catch (e) {
        setSubmitError(
          e instanceof Error ? e.message : "Could not set delivery"
        )
      }
    })
  })

  return (
    <form noValidate onSubmit={onSubmit}>
      {methods.length === 0 ? (
        <p className="text-[14px] text-[var(--ink-soft)]">
          No delivery methods available for this region.
        </p>
      ) : (
        <Controller
          control={form.control}
          name="shipping_option_id"
          render={({ field }) => (
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              aria-label="Delivery method"
            >
              {methods.map((m) => {
                const isFree = m.amount === 0
                const price = isFree ? (
                  <span className="free">Free</span>
                ) : (
                  formatPrice(m.amount ?? 0, currency)
                )
                return (
                  <RadioCard
                    key={m.id}
                    value={m.id}
                    selected={field.value === m.id}
                    title={m.name}
                    description={describeMethod(m)}
                    right={price}
                  />
                )
              })}
            </RadioGroup>
          )}
        />
      )}

      {submitError && (
        <p className="err" style={{ marginTop: 14 }}>
          {submitError}
        </p>
      )}

      <button
        type="submit"
        className="continue"
        disabled={pending || methods.length === 0}
      >
        <span>{pending ? "Saving…" : "Continue to payment"}</span>
        <span>→</span>
      </button>
    </form>
  )
}

function DeliveryDone({ cart }: { cart: HttpTypes.StoreCart }) {
  const method = cart.shipping_methods?.[0]
  if (!method) return null
  const currency = cart.currency_code ?? "eur"
  return (
    <SummaryRow>
      <SummaryCell label="Method">{method.name}</SummaryCell>
      <SummaryCell label="Total">
        {formatPrice(method.total ?? method.amount ?? 0, currency)}
      </SummaryCell>
    </SummaryRow>
  )
}
