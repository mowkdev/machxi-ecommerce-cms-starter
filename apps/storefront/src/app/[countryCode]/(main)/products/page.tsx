import { redirect } from "next/navigation"

export default async function ProductsRedirect({
  params,
}: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await params
  redirect(`/${countryCode}/shop/all`)
}
