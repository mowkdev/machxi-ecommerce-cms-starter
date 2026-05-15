"use client"

import LocalizedLink from "@/modules/common/components/localized-link"
import { useState } from "react"

import { siteConfig } from "@/config/site"

export function Footer() {
  const [joined, setJoined] = useState(false)

  return (
    <footer className="bg-[var(--footer-bg)] text-[var(--footer-fg)] pt-20 pb-9">
      <div className="container-padded">
        <div className="grid gap-12 mb-[72px] grid-cols-1 sm:grid-cols-2 lg:[grid-template-columns:1.4fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-5 max-w-[360px] sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3.5">
              <span
                className="block w-[44px] h-[44px]"
                role="img"
                aria-label="Dabasberns"
                style={{
                  backgroundColor: "var(--footer-fg)",
                  WebkitMaskImage: "url(/assets/logo-icon.svg)",
                  WebkitMaskSize: "contain",
                  WebkitMaskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  maskImage: "url(/assets/logo-icon.svg)",
                  maskSize: "contain",
                  maskRepeat: "no-repeat",
                  maskPosition: "center",
                }}
              />
            </div>
            <p className="text-[14px] leading-[1.6] opacity-65 m-0">
              {siteConfig.footer.blurb}
            </p>
            <form
              className="flex border-b border-[color-mix(in_srgb,var(--footer-fg)_30%,transparent)] pb-2.5 mt-2"
              onSubmit={(e) => {
                e.preventDefault()
                setJoined(true)
              }}
            >
              <input
                type="email"
                placeholder="your email"
                className="flex-1 bg-transparent border-0 text-[var(--footer-fg)] font-[inherit] text-[14px] outline-none py-1.5 placeholder:text-[color-mix(in_srgb,var(--footer-fg)_50%,transparent)]"
              />
              <button
                type="submit"
                className="bg-transparent border-0 text-accent font-[inherit] text-[13px] tracking-[0.18em] uppercase cursor-pointer py-1.5 transition-colors hover:text-[var(--footer-fg)]"
              >
                {joined ? "Thank you →" : "Join →"}
              </button>
            </form>
          </div>

          {siteConfig.footer.columns.map((col) => (
            <div key={col.title} className="col">
              <h4 className="font-body font-medium text-[11px] tracking-[0.28em] uppercase text-[color-mix(in_srgb,var(--footer-fg)_55%,transparent)] m-0 mb-[22px]">
                {col.title}
              </h4>
              <ul className="list-none p-0 m-0 flex flex-col gap-3.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <LocalizedLink
                      href={link.href}
                      className="text-[var(--footer-fg)] no-underline text-[15px] opacity-90 transition-opacity hover:text-accent hover:opacity-100"
                    >
                      {link.label}
                    </LocalizedLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row md:justify-between gap-3 pt-7 border-t border-[color-mix(in_srgb,var(--footer-fg)_14%,transparent)] text-[12px] opacity-55 tracking-[0.04em]">
          <div>{siteConfig.footer.copyright}</div>
          <div className="flex gap-6">
            {siteConfig.footer.legal.map((link) => (
              <LocalizedLink
                key={link.label}
                href={link.href}
                className="no-underline"
                style={{ color: "inherit" }}
              >
                {link.label}
              </LocalizedLink>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
