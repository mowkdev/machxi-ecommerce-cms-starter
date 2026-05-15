import { Footer } from "@/modules/layout/components/footer"
import { Header } from "@/modules/layout/components/header"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  )
}
