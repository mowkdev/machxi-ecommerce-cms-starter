import { redirect } from "next/navigation"

export default async function ShopIndexPage({
  params,
}: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await params
  redirect(`/${countryCode}/shop/all`)
}
