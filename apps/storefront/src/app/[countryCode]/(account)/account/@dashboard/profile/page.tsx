import { AccountNav } from "@/modules/account/components/account-nav"
import { ProfileForm } from "@/modules/account/components/profile-form"
import { retrieveCustomer } from "@/lib/data/customer"

export const metadata = { title: "Profile — Dabasberns" }

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await params
  const customer = await retrieveCustomer()
  if (!customer) return null

  return (
    <div className="acct-layout">
      <aside className="acct-side" aria-label="Account navigation">
        <AccountNav countryCode={countryCode} />
      </aside>

      <section className="acct-main">
        <span className="eb">Profile</span>
        <h1>Your details</h1>
        <p className="lede">
          The name we&apos;ll print on shipping labels, and the email we use for
          order confirmations and quiet workshop updates.
        </p>

        <ProfileForm customer={customer} />
      </section>
    </div>
  )
}
