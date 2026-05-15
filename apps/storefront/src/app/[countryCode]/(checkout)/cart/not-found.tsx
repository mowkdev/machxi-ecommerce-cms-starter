import LocalizedLink from "@/modules/common/components/localized-link"

export default function CartNotFound() {
  return (
    <main className="shop shop-checkout" data-screen-label="Cart not found">
      <div className="cart-empty-large">
        <span className="icon" aria-hidden>
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 7h14l-1.4 11a2 2 0 0 1-2 1.8H8.4a2 2 0 0 1-2-1.8L5 7z" />
            <path d="M9 7V5.5a3 3 0 0 1 6 0V7" />
          </svg>
        </span>
        <h3>No cart here</h3>
        <p>
          We couldn&apos;t find the cart you&apos;re after. Start a new bench by
          adding something from the workshop.
        </p>
        <LocalizedLink
          href="/products"
          className="cta-checkout"
          style={{ marginTop: 14, minWidth: 240 }}
        >
          <span>Browse the workshop</span>
          <span>→</span>
        </LocalizedLink>
      </div>
    </main>
  )
}
