"use client"

import { useState, useTransition } from "react"

import { applyPromotions } from "@/lib/data/cart"
import { useCart } from "@/modules/cart/components/cart-provider"

export function PromoForm({ currentCodes }: { currentCodes: string[] }) {
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const { refreshCart } = useCart()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return
    setError(null)
    startTransition(async () => {
      try {
        await applyPromotions([...currentCodes.filter(Boolean), code.trim()])
        await refreshCart()
        setCode("")
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not apply code")
      }
    })
  }

  const remove = (toRemove: string) => {
    startTransition(async () => {
      try {
        await applyPromotions(currentCodes.filter((c) => c !== toRemove))
        await refreshCart()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not remove code")
      }
    })
  }

  const applied = currentCodes.filter(Boolean)

  return (
    <div className="promo">
      <label className="lbl" htmlFor="promo-code">
        Promo code
      </label>
      <form onSubmit={submit} className="row">
        <input
          id="promo-code"
          type="text"
          placeholder="Enter code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          disabled={pending}
        />
        <button
          type="submit"
          className="apply"
          disabled={pending || !code.trim()}
        >
          {pending ? "…" : "Apply"}
        </button>
      </form>
      {error && <p className="err">{error}</p>}
      {applied.length > 0 && (
        <div className="applied">
          {applied.map((c) => (
            <span key={c} className="chip">
              {c}
              <button
                type="button"
                className="x"
                onClick={() => remove(c)}
                aria-label={`Remove ${c}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
