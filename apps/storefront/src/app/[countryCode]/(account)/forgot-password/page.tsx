import LocalizedLink from "@/modules/common/components/localized-link"

import { ForgotPasswordForm } from "@/modules/account/components/forgot-password-form"

export const metadata = {
  title: "Forgot password — Dabasberns",
}

export default function ForgotPasswordPage() {
  return (
    <main className="shop shop-checkout" data-screen-label="Forgot password">
      <div className="crumb">
        <LocalizedLink href="/">Dabasberns</LocalizedLink>
        <span className="sep">/</span>
        <LocalizedLink href="/sign-in">Sign in</LocalizedLink>
        <span className="sep">/</span>
        <span className="now">Forgot password</span>
      </div>

      <div className="auth-wrap">
        <header className="auth-head">
          <span className="eb">No worries</span>
          <h1>Forgot password</h1>
          <p className="sub">
            Type the email you used to sign up. We&apos;ll send a link to choose
            a new password.
          </p>
        </header>

        <ForgotPasswordForm />

        <div className="auth-foot">
          Remembered it? <LocalizedLink href="/sign-in">Sign in</LocalizedLink>
        </div>
      </div>
    </main>
  )
}
