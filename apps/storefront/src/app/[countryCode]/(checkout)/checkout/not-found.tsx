import LocalizedLink from "@/modules/common/components/localized-link"

export default function CheckoutNotFound() {
  return (
    <main className="shop shop-checkout" data-screen-label="Checkout not found">
      <div className="cart-empty-large">
        <h3>Nothing to check out</h3>
        <p>Add something to your bench before heading to checkout.</p>
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
