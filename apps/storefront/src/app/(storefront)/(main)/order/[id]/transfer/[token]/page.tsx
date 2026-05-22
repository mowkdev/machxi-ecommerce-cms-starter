import LocalizedLink from "@/modules/common/components/localized-link"

export const metadata = {
  title: "Transfer order — Dabasberns",
}

export default async function TransferLandingPage({
  params,
}: {
  params: Promise<{ id: string; token: string }>
}) {
  const { id, token } = await params

  return (
    <main className="shop" data-screen-label="Transfer order">
      <div className="crumb">
        <LocalizedLink href="/">Dabasberns</LocalizedLink>
        <span className="sep">/</span>
        <span className="now">Transfer order</span>
      </div>

      <div className="auth-shell">
        <div className="auth-head">
          <span className="eyebrow">Transfer request</span>
          <h1>Take over this order</h1>
          <p className="sub">
            Someone has invited you to take ownership of order{" "}
            <strong style={{ color: "var(--ink)" }}>#{id.slice(-8)}</strong>.
            You&apos;ll see it in your account once you accept.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            marginTop: 8,
          }}
        >
          <LocalizedLink
            href={`/order/${id}/transfer/${token}/accept`}
            className="auth-cta"
            style={{ textDecoration: "none" }}
          >
            <span>Accept transfer</span>
            <span>→</span>
          </LocalizedLink>
          <LocalizedLink
            href={`/order/${id}/transfer/${token}/decline`}
            className="link-mini"
            style={{
              textAlign: "center",
              color: "var(--ink-soft)",
              marginTop: 4,
            }}
          >
            Decline
          </LocalizedLink>
        </div>
      </div>
    </main>
  )
}
