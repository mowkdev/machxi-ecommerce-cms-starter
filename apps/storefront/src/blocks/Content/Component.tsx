import type { ContentBlock as Props } from "../types"
import { CMSLink } from "@/components/payload/CMSLink"
import { PayloadRichText } from "@/components/payload/RichText"
import { cn } from "@/lib/utils"

const colSpan = {
  full: "md:col-span-12",
  half: "md:col-span-6",
  oneThird: "md:col-span-4",
  twoThirds: "md:col-span-8",
} as const

export function ContentBlock({ columns }: Props) {
  if (!columns?.length) return null

  return (
    <div className="container">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
        {columns.map((col, i) => (
          <div
            key={col.id ?? i}
            className={cn("flex flex-col gap-4", colSpan[col.size ?? "oneThird"])}
          >
            {col.richText ? <PayloadRichText data={col.richText} /> : null}
            {col.enableLink && col.link ? <CMSLink {...col.link} /> : null}
          </div>
        ))}
      </div>
    </div>
  )
}
