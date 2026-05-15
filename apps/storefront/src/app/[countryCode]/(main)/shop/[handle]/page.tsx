import { ShopTemplate } from "@/modules/shop/components/shop-template"

export const dynamic = "force-dynamic"

export default async function ShopCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ countryCode: string; handle: string }>
  searchParams: Promise<{ sort?: string }>
}) {
  const { countryCode, handle } = await params
  const { sort } = await searchParams

  return (
    <ShopTemplate
      countryCode={countryCode}
      handle={handle}
      page={1}
      rawSort={sort}
    />
  )
}
