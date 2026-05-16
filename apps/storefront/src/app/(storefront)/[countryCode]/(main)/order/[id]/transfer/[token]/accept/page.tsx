import LocalizedLink from "@/modules/common/components/localized-link"

import { acceptTransferRequest } from "@/lib/data/orders"

export const metadata = { title: "Transfer accepted — Dabasberns" }

export default async function AcceptTransferPage({
  params,
}: {
  params: Promise<{ countryCode: string; id: string; token: string }>
}) {
  const { id, token } = await params
  const result = await acceptTransferRequest(id, token)

  return (
    <main className="shop" data-screen-label="Transfer accepted">
      <div className="crumb">
        <LocalizedLink href="/">Dabasberns</LocalizedLink>
        <span className="sep">/</span>
        <span className="now">Transfer</span>
      </div>

      <div className="auth-shell" style={{ textAlign: "center" }}>
        <div className="auth-head">
          <span className="eyebrow">
            {result.success ? "Done" : "Something went wrong"}
          </span>
          <h1>{result.success ? "Order accepted" : "Could not accept"}</h1>
          <p className="sub">
            {result.success
              ? "The order is now linked to your account. You can see it under Orders."
              : (result.error ?? "The link may have expired.")}
          </p>
        </div>

        <LocalizedLink
          href={result.success ? "/account/orders" : "/account"}
          className="auth-cta"
          style={{ display: "inline-flex", textDecoration: "none" }}
        >
          <span>{result.success ? "See orders" : "Back to account"}</span>
          <span>→</span>
        </LocalizedLink>
      </div>
    </main>
  )
}
