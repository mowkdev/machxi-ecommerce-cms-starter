import { redirect } from "next/navigation"

import LocalizedLink from "@/modules/common/components/localized-link"
import { SignInForm } from "@/modules/account/components/sign-in-form"
import { retrieveCustomer } from "@/lib/data/customer"

export const metadata = {
  title: "Sign in — Dabasberns",
}

export default async function SignInPage({
  params,
}: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await params
  const customer = await retrieveCustomer()
  if (customer) {
    redirect(`/${countryCode}/account`)
  }

  return (
    <main className="shop shop-checkout" data-screen-label="Sign in">
      <div className="crumb">
        <LocalizedLink href="/">Dabasberns</LocalizedLink>
        <span className="sep">/</span>
        <span className="now">Sign in</span>
      </div>

      <div className="auth-wrap">
        <header className="auth-head">
          <span className="eb">Welcome back</span>
          <h1>Account</h1>
          <p className="sub">
            Sign in to see your orders, saved addresses and bench history.
          </p>
        </header>

        <SignInForm countryCode={countryCode} />

        <div className="auth-foot">
          New to Dabasberns?{" "}
          <LocalizedLink href="/sign-up">Create an account</LocalizedLink>
        </div>
      </div>
    </main>
  )
}
