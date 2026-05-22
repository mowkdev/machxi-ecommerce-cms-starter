import Image from "next/image"

import type { HeroProps } from "../types"
import { CMSLink } from "@/components/payload/CMSLink"
import { PayloadRichText } from "@/components/payload/RichText"

export function MediumImpactHero({ richText, links, media }: HeroProps) {
  const mediaUrl = typeof media === "object" && media !== null ? media.url ?? null : null
  const mediaAlt =
    (typeof media === "object" && media !== null && media.alt) || "Hero media"

  return (
    <section className="bg-paper text-ink">
      <div className="container flex flex-col gap-10 py-16 md:py-24">
        <div className="flex flex-col gap-6">
          {richText ? (
            <PayloadRichText
              data={richText}
              className="font-display text-3xl leading-tight md:text-5xl"
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
        {mediaUrl ? (
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md bg-paper-2">
            <Image
              src={mediaUrl}
              alt={mediaAlt}
              fill
              sizes="(min-width: 1024px) 1024px, 100vw"
              className="object-cover"
            />
          </div>
        ) : null}
      </div>
    </section>
  )
}
