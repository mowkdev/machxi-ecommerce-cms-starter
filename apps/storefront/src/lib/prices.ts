import { HttpTypes } from "@medusajs/types"

export function formatPrice(amount: number, currencyCode: string): string {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: currencyCode,
  }).format(amount)
}

export function getCheapestProductPrice(product: HttpTypes.StoreProduct): {
  calculated_amount: number
  currency_code: string
  formatted: string
} | null {
  if (!product.variants?.length) return null

  let cheapest: {
    calculated_amount: number
    currency_code: string
  } | null = null

  for (const variant of product.variants) {
    const cp = variant.calculated_price
    if (!cp) continue
    const amount = cp.calculated_amount ?? 0
    const currency = cp.currency_code ?? "eur"

    if (!cheapest || amount < cheapest.calculated_amount) {
      cheapest = { calculated_amount: amount, currency_code: currency }
    }
  }

  if (!cheapest) return null

  return {
    ...cheapest,
    formatted: formatPrice(cheapest.calculated_amount, cheapest.currency_code),
  }
}

export function getVariantPrice(variant: HttpTypes.StoreProductVariant): {
  calculated_amount: number
  currency_code: string
  formatted: string
} | null {
  const cp = variant.calculated_price
  if (!cp) return null

  const amount = cp.calculated_amount ?? 0
  const currency = cp.currency_code ?? "eur"

  return {
    calculated_amount: amount,
    currency_code: currency,
    formatted: formatPrice(amount, currency),
  }
}
