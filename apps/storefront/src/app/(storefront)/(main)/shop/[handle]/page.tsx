import { notFound } from "next/navigation"

import { ShopTemplate } from "@/modules/shop/components/shop-template"
import { getCountryCode } from "@/lib/data/cookies"

export const dynamic = "force-dynamic"

export default async function ShopCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>
  searchParams: Promise<{ sort?: string }>
}) {
  const { handle } = await params
  const { sort } = await searchParams

  const countryCode = await getCountryCode()
  if (!countryCode) notFound()

  return (
    <ShopTemplate
      countryCode={countryCode}
      handle={handle}
      page={1}
      rawSort={sort}
    />
  )
}
