import { PageNotFound } from "@/modules/common/components/page-not-found"

export default function ProductNotFound() {
  return (
    <PageNotFound
      eyebrow="Sold out"
      title="Off the bench"
      message="This product isn't on the bench right now. Browse the rest of the workshop."
      ctaLabel="Browse the workshop"
      ctaHref="/products"
    />
  )
}
