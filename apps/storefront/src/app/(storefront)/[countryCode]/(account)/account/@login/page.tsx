import LocalizedLink from "@/modules/common/components/localized-link"

import { SignInForm } from "@/modules/account/components/sign-in-form"

export default async function AccountLoginSlot({
  params,
}: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await params

  return (
    <div className="auth-shell">
      <div className="auth-head">
        <span className="eyebrow">Welcome back</span>
        <h1>Account</h1>
        <p className="sub">
          Sign in to see your orders, saved addresses and bench history.
        </p>
      </div>

      <SignInForm countryCode={countryCode} />

      <div className="auth-foot">
        New to Dabasberns?{" "}
        <LocalizedLink href="/sign-up">Create an account</LocalizedLink>
      </div>
    </div>
  )
}
