import { redirect } from "next/navigation"

import LocalizedLink from "@/modules/common/components/localized-link"
import { SignUpForm } from "@/modules/account/components/sign-up-form"
import { retrieveCustomer } from "@/lib/data/customer"

export const metadata = {
  title: "Create account — Dabasberns",
}

export default async function SignUpPage() {
  const customer = await retrieveCustomer()
  if (customer) {
    redirect("/account")
  }

  return (
    <main className="shop shop-checkout" data-screen-label="Create account">
      <div className="crumb">
        <LocalizedLink href="/">Dabasberns</LocalizedLink>
        <span className="sep">/</span>
        <span className="now">Create account</span>
      </div>

      <div className="auth-wrap">
        <header className="auth-head">
          <span className="eb">Take a seat</span>
          <h1>Create account</h1>
          <p className="sub">
            Save your bench, follow new batches, and get a heads-up when
            something quiet ships.
          </p>
        </header>

        <SignUpForm />

        <div className="auth-foot">
          Already have an account?{" "}
          <LocalizedLink href="/sign-in">Sign in</LocalizedLink>
          <span className="legal">
            By creating an account you agree to our{" "}
            <LocalizedLink href="#">Terms</LocalizedLink> and{" "}
            <LocalizedLink href="#">Privacy Notice</LocalizedLink>.
          </span>
        </div>
      </div>
    </main>
  )
}
