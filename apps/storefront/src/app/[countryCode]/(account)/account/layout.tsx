import LocalizedLink from "@/modules/common/components/localized-link"

import { retrieveCustomer } from "@/lib/data/customer"

export default async function AccountLayout({
  dashboard,
  login,
}: {
  dashboard: React.ReactNode
  login: React.ReactNode
}) {
  const customer = await retrieveCustomer().catch(() => null)

  return (
    <main className="shop shop-checkout" data-screen-label="Account">
      <div className="crumb">
        <LocalizedLink href="/">Dabasberns</LocalizedLink>
        <span className="sep">/</span>
        <span className="now">Account</span>
      </div>
      {customer ? dashboard : login}
    </main>
  )
}
