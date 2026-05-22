import { notFound } from "next/navigation"
import { NextIntlClientProvider, hasLocale } from "next-intl"
import { setRequestLocale } from "next-intl/server"

import { CartUiProvider } from "@/modules/cart/components/cart-panel"
import { CartProvider } from "@/modules/cart/components/cart-provider"
import { MobileMenuProvider } from "@/modules/layout/components/mobile-menu"
import { ThemeProvider } from "@/modules/layout/components/theme-provider"
import { SmoothScrollProvider } from "@/modules/layout/components/smooth-scroll"
import { ToastProvider } from "@/modules/common/ui/toast"
import { retrieveCart } from "@/lib/data/cart"
import { routing } from "@/i18n/routing"

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  setRequestLocale(locale)

  const cart = await retrieveCart().catch(() => null)

  return (
    <NextIntlClientProvider>
      <ThemeProvider>
        <ToastProvider>
          <MobileMenuProvider>
            <CartProvider initialCart={cart}>
              <CartUiProvider>
                <SmoothScrollProvider>{children}</SmoothScrollProvider>
              </CartUiProvider>
            </CartProvider>
          </MobileMenuProvider>
        </ToastProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  )
}
