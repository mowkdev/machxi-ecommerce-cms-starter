import LocalizedLink from "@/modules/common/components/localized-link"

import { ResetPasswordForm } from "@/modules/account/components/reset-password-form"

export const metadata = {
  title: "Reset password — Dabasberns",
}

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ token?: string; email?: string }>
}) {
  const { countryCode } = await params
  const { token = "", email = "" } = await searchParams

  const invalid = !token || !email

  return (
    <main className="shop shop-checkout" data-screen-label="Reset password">
      <div className="crumb">
        <LocalizedLink href="/">Dabasberns</LocalizedLink>
        <span className="sep">/</span>
        <span className="now">Reset password</span>
      </div>

      <div className="auth-wrap">
        <header className="auth-head">
          <span className="eb">Almost done</span>
          <h1>Reset password</h1>
          <p className="sub">
            {invalid
              ? "This link is missing or invalid. Request a new one from the forgot password page."
              : "Pick a new password for your account. At least eight characters with a letter and a number."}
          </p>
        </header>

        {invalid ? (
          <div style={{ textAlign: "center", marginTop: 24 }}>
            <LocalizedLink href="/forgot-password" className="btn-primary">
              <span>Request new link</span>
              <span className="arr">→</span>
            </LocalizedLink>
          </div>
        ) : (
          <ResetPasswordForm
            email={email}
            token={token}
            countryCode={countryCode}
          />
        )}
      </div>
    </main>
  )
}
