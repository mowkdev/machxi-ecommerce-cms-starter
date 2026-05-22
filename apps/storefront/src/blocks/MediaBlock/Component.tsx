import Image from "next/image"

import type { MediaBlock as Props } from "../types"

export function MediaBlock({ media }: Props) {
  if (typeof media !== "object" || media === null || !media.url) return null

  return (
    <div className="container">
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md bg-paper-2">
        <Image
          src={media.url}
          alt={media.alt ?? ""}
          fill
          sizes="(min-width: 1024px) 1024px, 100vw"
          className="object-cover"
        />
      </div>
    </div>
  )
}
