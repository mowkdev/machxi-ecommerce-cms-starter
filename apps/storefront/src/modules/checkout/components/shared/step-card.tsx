"use client"

import { type ReactNode } from "react"

import type { CheckoutStep } from "@/lib/checkout/schemas"

export type StepState = "active" | "done" | "pending"

type StepCardProps = {
  step: CheckoutStep
  state: StepState
  number: number
  title: string
  onEdit?: () => void
  done?: ReactNode
  active?: ReactNode
}

export function StepCard({
  step,
  state,
  number,
  title,
  onEdit,
  done,
  active,
}: StepCardProps) {
  return (
    <section
      className={`step-card is-${state}`}
      data-step-card={step}
      aria-labelledby={`step-${step}-h`}
    >
      <header className="step-head">
        <div className="label">
          <span className="done-mark" aria-hidden>
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
          <span className="n">{String(number).padStart(2, "0")}</span>
          <h3 id={`step-${step}-h`}>{title}</h3>
        </div>
        {state === "done" && onEdit && (
          <button type="button" className="edit" onClick={onEdit}>
            Edit
          </button>
        )}
      </header>

      {state === "active" && active && <div className="body">{active}</div>}
      {state === "done" && done && <div className="body">{done}</div>}
    </section>
  )
}
