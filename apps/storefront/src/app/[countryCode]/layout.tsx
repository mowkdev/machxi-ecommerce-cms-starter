import { notFound } from "next/navigation"

import { CartUiProvider } from "@/modules/cart/components/cart-panel"
import { CartProvider } from "@/modules/cart/components/cart-provider"
import { retrieveCart } from "@/lib/data/cart"
import { getRegion } from "@/lib/data/regions"

export default async function CountryLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await params
  const region = await getRegion(countryCode)

  if (!region) {
    notFound()
  }

  const cart = await retrieveCart().catch(() => null)

  return (
    <CartProvider initialCart={cart} countryCode={countryCode}>
      <CartUiProvider>{children}</CartUiProvider>
    </CartProvider>
  )
}
