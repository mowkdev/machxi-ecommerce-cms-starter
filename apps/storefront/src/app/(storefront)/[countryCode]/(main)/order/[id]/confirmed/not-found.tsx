import { PageNotFound } from "@/modules/common/components/page-not-found"

export default function OrderNotFound() {
  return (
    <PageNotFound
      eyebrow="Order missing"
      title="No order here"
      message="We couldn't find that order. If you just placed it, give it a moment and try again."
      ctaLabel="Back to account"
      ctaHref="/account"
    />
  )
}
