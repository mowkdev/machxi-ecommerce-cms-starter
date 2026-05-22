import type { CallToActionBlock as Props } from "../types"
import { CMSLink } from "@/components/payload/CMSLink"
import { PayloadRichText } from "@/components/payload/RichText"

export function CallToActionBlock({ richText, links }: Props) {
  return (
    <div className="container">
      <div className="flex flex-col items-start gap-6 rounded-md border border-paper-3 bg-paper-2 p-8 md:flex-row md:items-center md:justify-between md:p-12">
        <div className="flex-1">
          {richText ? (
            <PayloadRichText
              data={richText}
              className="font-display text-2xl leading-snug md:text-3xl"
            />
          ) : null}
        </div>
        {links && links.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {links.map(({ link, id }, i) =>
              link ? <CMSLink key={id ?? i} {...link} /> : null,
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
