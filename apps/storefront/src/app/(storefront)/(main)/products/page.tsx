import { redirect } from "next/navigation"

export default async function ProductsRedirect() {
  redirect("/shop/all")
}
