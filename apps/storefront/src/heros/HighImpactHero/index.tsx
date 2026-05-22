import Image from "next/image"

import type { HeroProps } from "../types"
import { CMSLink } from "@/components/payload/CMSLink"
import { PayloadRichText } from "@/components/payload/RichText"
import { cn } from "@/lib/utils"

export function HighImpactHero({ richText, links, media }: HeroProps) {
  const mediaUrl = typeof media === "object" && media !== null ? media.url ?? null : null
  const mediaAlt =
    (typeof media === "object" && media !== null && media.alt) || "Hero background"

  return (
    <section className="relative min-h-[80vh] w-full overflow-hidden bg-paper-3 text-ink">
      {mediaUrl ? (
        <Image
          src={mediaUrl}
          alt={mediaAlt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      ) : null}
      <div className="absolute inset-0 bg-ink/30" aria-hidden />
      <div
        className={cn(
          "container relative z-10 flex min-h-[80vh] flex-col justify-end gap-6 py-16 text-paper",
          "md:gap-8 md:pb-24",
        )}
      >
        {richText ? (
          <PayloadRichText
            data={richText}
            className="font-display text-4xl leading-tight md:text-6xl"
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
