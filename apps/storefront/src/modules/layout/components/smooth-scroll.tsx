"use client"

import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"
import { useEffect, type ReactNode } from "react"

const ReactLenis = dynamic(
  () => import("lenis/react").then((m) => m.ReactLenis),
  { ssr: false }
)

function ScrollToTopOnNavigate() {
  const pathname = usePathname()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" })
  }, [pathname])
  return null
}

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  return (
    <ReactLenis
      root
      options={{
        lerp: 0.1,
        duration: 1.2,
        smoothWheel: true,
      }}
    >
      <ScrollToTopOnNavigate />
      {children}
    </ReactLenis>
  )
}
