import LocalizedLink from "@/modules/common/components/localized-link"

export function PageNotFound({
  eyebrow = "Not found",
  title = "Out of stock",
  message = "What you're looking for isn't here. It may have moved, sold out, or never existed.",
  ctaLabel = "Back to the workshop",
  ctaHref = "/products",
}: {
  eyebrow?: string
  title?: string
  message?: string
  ctaLabel?: string
  ctaHref?: string
}) {
  return (
    <main className="shop" data-screen-label={title}>
      <div className="crumb">
        <LocalizedLink href="/">Dabasberns</LocalizedLink>
        <span className="sep">/</span>
        <span className="now">{eyebrow}</span>
      </div>

      <div className="auth-shell" style={{ textAlign: "center" }}>
        <div className="auth-head">
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p className="sub">{message}</p>
        </div>
        <LocalizedLink
          href={ctaHref}
          className="auth-cta"
          style={{ display: "inline-flex", textDecoration: "none" }}
        >
          <span>{ctaLabel}</span>
          <span>→</span>
        </LocalizedLink>
      </div>
    </main>
  )
}
