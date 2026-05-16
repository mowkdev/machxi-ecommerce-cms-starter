import { AccountNav } from "@/modules/account/components/account-nav"
import { AddressBook } from "@/modules/account/components/address-book"
import { retrieveCustomer } from "@/lib/data/customer"
import { listRegions } from "@/lib/data/regions"

export const metadata = { title: "Addresses — Dabasberns" }

export default async function AddressesPage({
  params,
}: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await params
  const customer = await retrieveCustomer()
  if (!customer) return null

  const regions = (await listRegions().catch(() => [])) ?? []
  const seen = new Set<string>()
  const countries: { code: string; label: string }[] = []
  for (const region of regions) {
    for (const country of region.countries ?? []) {
      const code = country.iso_2
      if (!code || seen.has(code)) continue
      seen.add(code)
      countries.push({
        code,
        label: country.display_name ?? country.name ?? code.toUpperCase(),
      })
    }
  }
  countries.sort((a, b) => a.label.localeCompare(b.label))

  return (
    <div className="acct-layout">
      <aside className="acct-side" aria-label="Account navigation">
        <AccountNav countryCode={countryCode} />
      </aside>

      <section className="acct-main">
        <span className="eb">Addresses</span>
        <h1>Address book</h1>
        <p className="lede">
          The places we send your bench to. The first one we save becomes your
          default — change it any time at checkout.
        </p>

        <AddressBook
          addresses={customer.addresses ?? []}
          countryCode={countryCode}
          countries={countries}
        />
      </section>
    </div>
  )
}
