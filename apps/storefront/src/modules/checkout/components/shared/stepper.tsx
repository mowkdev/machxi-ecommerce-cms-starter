"use client"

import { Fragment } from "react"

import {
  CHECKOUT_STEPS,
  STEP_LABEL,
  type CheckoutStep,
} from "@/lib/checkout/schemas"

type StepperProps = {
  current: CheckoutStep
  isDone: (step: CheckoutStep) => boolean
  onSelect: (step: CheckoutStep) => void
}

export function Stepper({ current, isDone, onSelect }: StepperProps) {
  return (
    <nav className="stepper" aria-label="Checkout steps">
      {CHECKOUT_STEPS.map((step, i) => {
        const done = isDone(step)
        const active = step === current
        const state = active ? "active" : done ? "done" : "pending"
        return (
          <Fragment key={step}>
            <button
              type="button"
              className={`step ${state}`}
              disabled={state === "pending"}
              aria-current={active ? "step" : undefined}
              onClick={() => onSelect(step)}
            >
              <span className="check" aria-hidden>
                <svg
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 6.5l2.5 2.5L10 3" />
                </svg>
              </span>
              <span className="n">{String(i + 1).padStart(2, "0")}</span>
              <span className="t">{STEP_LABEL[step]}</span>
            </button>
            {i < CHECKOUT_STEPS.length - 1 && (
              <span className={`line${done ? " done" : ""}`} />
            )}
          </Fragment>
        )
      })}
    </nav>
  )
}
