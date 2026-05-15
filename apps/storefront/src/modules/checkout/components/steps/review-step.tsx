"use client"

import { HttpTypes } from "@medusajs/types"
import { useState, useTransition } from "react"

import { placeOrder } from "@/lib/data/cart"
import { formatPrice } from "@/lib/prices"

import { StepCard } from "../shared/step-card"
import { SummaryCell, SummaryRow } from "../shared/summary-row"
import type { StepState } from "../shared/step-card"

type ReviewStepProps = {
  cart: HttpTypes.StoreCart
  state: StepState
}

export function ReviewStep({ cart, state }: ReviewStepProps) {
  return (
    <StepCard
      step="review"
      state={state}
      number={4}
      title="Review & place order"
      active={<ReviewActive cart={cart} />}
    />
  )
}

function ReviewActive({ cart }: { cart: HttpTypes.StoreCart }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const currency = cart.currency_code ?? "eur"
  const ship = cart.shipping_address
  const method = cart.shipping_methods?.[0]
  const session = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )
  const ready = !!ship?.address_1 && !!method && !!session

  const submit = () => {
    if (!ready) return
    setError(null)
    startTransition(async () => {
      try {
        await placeOrder()
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not place order")
      }
    })
  }

  const total = cart.total ?? cart.item_subtotal ?? 0

  return (
    <>
      <p
        style={{
          fontSize: 14,
          lineHeight: 1.65,
          color: "var(--ink-soft)",
          margin: "0 0 24px",
          maxWidth: "56ch",
        }}
      >
        One last look. By placing the order you accept our{" "}
        <a
          href="#"
          style={{
            color: "var(--ink)",
            textDecoration: "underline",
            textUnderlineOffset: 3,
          }}
        >
          Terms &amp; Conditions
        </a>{" "}
        and confirm you&apos;ve read our{" "}
        <a
          href="#"
          style={{
            color: "var(--ink)",
            textDecoration: "underline",
            textUnderlineOffset: 3,
          }}
        >
          Privacy Notice
        </a>
        .
      </p>

      {ship && (
        <SummaryRow cols={3}>
          <SummaryCell label="Ship to">
            {ship.first_name} {ship.last_name}
            <br />
            {ship.address_1}
            <br />
            {ship.postal_code} {ship.city}
            {ship.country_code ? `, ${ship.country_code.toUpperCase()}` : ""}
          </SummaryCell>
          {method && (
            <SummaryCell label="Delivery">
              {method.name}
              <br />
              {formatPrice(method.total ?? method.amount ?? 0, currency)}
            </SummaryCell>
          )}
          {session && (
            <SummaryCell label="Payment">
              {session.provider_id.replace(/^pp_/, "").replace(/_/g, " ")}
              <br />
              Billing: same as shipping
            </SummaryCell>
          )}
        </SummaryRow>
      )}

      {!ready && (
        <p className="err" style={{ marginTop: 14 }}>
          Complete the previous steps before placing the order.
        </p>
      )}
      {error && (
        <p className="err" style={{ marginTop: 14 }}>
          {error}
        </p>
      )}

      <button
        type="button"
        className="continue place-order"
        disabled={pending || !ready}
        onClick={submit}
      >
        <span>
          {pending
            ? "Placing order…"
            : `Place order · ${formatPrice(total, currency)}`}
        </span>
        <span>→</span>
      </button>

      <p className="legal">
        You won&apos;t be charged until you press the button above. Order
        confirmation lands in your inbox within a minute — keep an eye on the
        spam folder. Built with <a href="#">Medusa</a> · Payment by{" "}
        <a href="#">Stripe</a>.
      </p>
    </>
  )
}
