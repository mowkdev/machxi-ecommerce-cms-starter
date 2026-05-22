import type { Media } from "@/payload-types"
import {
  Creator as CreatorView,
  type SocialAccount,
} from "@/modules/home/components/creator"

import type { CreatorBlock as CreatorBlockProps } from "../types"

type MediaRef = (number | null) | Media | undefined

function mediaUrl(ref: MediaRef): string | undefined {
  if (ref && typeof ref === "object" && "url" in ref && ref.url) return ref.url
  return undefined
}

function nullToUndef<T>(value: T | null | undefined): T | undefined {
  return value ?? undefined
}

export function CreatorBlock({ video, author, socials }: CreatorBlockProps) {
  if (!video?.youtubeId || !author) return null

  const paragraphs = (author.paragraphs ?? []).map((p) => p.text)
  if (paragraphs.length === 0) return null

  const accounts: SocialAccount[] = (socials?.accounts ?? []).map((a) => ({
    platform: a.platform,
    url: a.url,
    handle: a.handle,
    count: nullToUndef(a.count),
    countLabel: nullToUndef(a.countLabel),
    cta: nullToUndef(a.cta),
  }))

  const socialsProp =
    socials && accounts.length > 0
      ? {
          eyebrow: nullToUndef(socials.eyebrow),
          heading: nullToUndef(socials.heading),
          total:
            socials.total?.value || socials.total?.label
              ? {
                  value: socials.total?.value ?? "",
                  label: socials.total?.label ?? "",
                }
              : undefined,
          accounts,
        }
      : undefined

  return (
    <CreatorView
      video={{
        youtubeId: video.youtubeId,
        title: video.title ?? "",
        posterImage: mediaUrl(video.posterImage),
      }}
      author={{
        eyebrow: nullToUndef(author.eyebrow),
        headlinePrefix: nullToUndef(author.headlinePrefix),
        headlineAccent: nullToUndef(author.headlineAccent),
        headlineSuffix: nullToUndef(author.headlineSuffix),
        paragraphs,
        signName: nullToUndef(author.signName),
        signRole: nullToUndef(author.signRole),
      }}
      socials={socialsProp}
    />
  )
}
