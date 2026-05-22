import type { HeroProps } from "../types"
import { CMSLink } from "@/components/payload/CMSLink"
import { PayloadRichText } from "@/components/payload/RichText"

export function LowImpactHero({ richText, links }: HeroProps) {
  return (
    <section className="bg-paper text-ink">
      <div className="container flex flex-col gap-6 py-12 md:py-16">
        {richText ? (
          <PayloadRichText
            data={richText}
            className="font-display text-2xl leading-snug md:text-4xl"
          />
        ) : null}
        {links && links.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {links.map(({ link, id }, i) =>
              link ? <CMSLink key={id ?? i} {...link} /> : null,
            )}
          </div>
        ) : null}
      </div>
    </section>
  )
}
