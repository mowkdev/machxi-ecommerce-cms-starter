import { MinimalShell } from "@/modules/checkout/components/checkout-chrome"

export default function CheckoutFlowLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <MinimalShell variant="checkout">{children}</MinimalShell>
}
