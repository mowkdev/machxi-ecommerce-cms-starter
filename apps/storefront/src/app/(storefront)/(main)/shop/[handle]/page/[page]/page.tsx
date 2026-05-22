import { notFound, redirect } from "next/navigation"

import { ShopTemplate } from "@/modules/shop/components/shop-template"
import { buildShopHref, parseSort } from "@/lib/shop-sort"
import { getCountryCode } from "@/lib/data/cookies"

export const dynamic = "force-dynamic"

export default async function ShopCategoryPagedPage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string; page: string }>
  searchParams: Promise<{ sort?: string }>
}) {
  const { handle, page: pageParam } = await params
  const { sort } = await searchParams

  const countryCode = await getCountryCode()
  if (!countryCode) notFound()

  const page = Number.parseInt(pageParam, 10)

  // /shop/[handle]/page/1 is not canonical — strip it.
  if (!Number.isInteger(page) || page < 1) {
    redirect(buildShopHref({ handle, sort: parseSort(sort) }))
  }
  if (page === 1) {
    redirect(buildShopHref({ handle, sort: parseSort(sort) }))
  }

  return (
    <ShopTemplate
      countryCode={countryCode}
      handle={handle}
      page={page}
      rawSort={sort}
    />
  )
}
