"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useMemo } from "react"

import { CHECKOUT_STEPS, type CheckoutStep } from "@/lib/checkout/schemas"

function isStep(value: string | null): value is CheckoutStep {
  return !!value && (CHECKOUT_STEPS as readonly string[]).includes(value)
}

export function useCheckoutNavigation(initialStep: CheckoutStep) {
  const router = useRouter()
  const params = useSearchParams()
  const fromUrl = params.get("step")
  const current: CheckoutStep = isStep(fromUrl) ? fromUrl : initialStep
  const currentIndex = CHECKOUT_STEPS.indexOf(current)

  const isDone = useCallback(
    (step: CheckoutStep) => CHECKOUT_STEPS.indexOf(step) < currentIndex,
    [currentIndex]
  )

  const isActive = useCallback(
    (step: CheckoutStep) => step === current,
    [current]
  )

  const goTo = useCallback(
    (step: CheckoutStep, opts: { scroll?: boolean } = {}) => {
      const search = new URLSearchParams(params.toString())
      search.set("step", step)
      router.push(`?${search.toString()}`, { scroll: opts.scroll ?? false })
      if (opts.scroll ?? true) {
        // scroll the card into view after navigation
        requestAnimationFrame(() => {
          const el = document.querySelector(`[data-step-card="${step}"]`)
          if (el instanceof HTMLElement) {
            const top = el.getBoundingClientRect().top + window.scrollY - 100
            window.scrollTo({ top, behavior: "smooth" })
          }
        })
      }
    },
    [params, router]
  )

  const refresh = useCallback(() => router.refresh(), [router])

  return useMemo(
    () => ({
      current,
      currentIndex,
      isDone,
      isActive,
      goTo,
      refresh,
      steps: CHECKOUT_STEPS,
    }),
    [current, currentIndex, isDone, isActive, goTo, refresh]
  )
}
