import { ReactNode } from "react"

import {
  VideoFrame,
  VideoFrameProps,
} from "@/modules/home/components/video-frame"

export type SocialPlatform =
  | "youtube"
  | "instagram"
  | "tiktok"
  | "x"
  | "facebook"

export type SocialAccount = {
  platform: SocialPlatform
  url: string
  handle: string
  count?: string
  countLabel?: string
  cta?: string
}

export type CreatorProps = {
  video: VideoFrameProps
  author: {
    eyebrow?: string
    headlinePrefix?: string
    headlineAccent?: string
    headlineSuffix?: string
    paragraphs: string[]
    signName?: string
    signRole?: string
  }
  socials?: {
    eyebrow?: string
    heading?: string
    total?: { value: string; label: string }
    accounts: SocialAccount[]
  }
}

const PLATFORM_META: Record<
  SocialPlatform,
  {
    name: string
    rowClass: string
    defaultCta: string
    defaultCountLabel: string
  }
> = {
  youtube: {
    name: "YouTube",
    rowClass: "yt",
    defaultCta: "Watch",
    defaultCountLabel: "subscribers",
  },
  instagram: {
    name: "Instagram",
    rowClass: "ig",
    defaultCta: "Follow",
    defaultCountLabel: "followers",
  },
  tiktok: {
    name: "TikTok",
    rowClass: "tt",
    defaultCta: "Follow",
    defaultCountLabel: "followers",
  },
  x: {
    name: "X",
    rowClass: "x",
    defaultCta: "Follow",
    defaultCountLabel: "followers",
  },
  facebook: {
    name: "Facebook",
    rowClass: "fb",
    defaultCta: "Follow",
    defaultCountLabel: "followers",
  },
}

function PlatformGlyph({ platform }: { platform: SocialPlatform }): ReactNode {
  switch (platform) {
    case "youtube":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2.5" y="5.5" width="19" height="13" rx="3.5" />
          <path d="M10 9.5v5l5-2.5z" fill="currentColor" stroke="none" />
        </svg>
      )
    case "instagram":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" />
        </svg>
      )
    case "tiktok":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 3v10.5a3.5 3.5 0 1 1-3.5-3.5" />
          <path d="M14 3c.4 2.6 2.4 4.6 5 5" />
        </svg>
      )
    case "x":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 4l16 16M20 4L4 20" />
        </svg>
      )
    case "facebook":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 8h2.5V4.5H14a3 3 0 0 0-3 3V10H8.5v3.5H11V21h3.5v-7.5h2.7L18 10h-3.5V8z" />
        </svg>
      )
  }
}

export function Creator({ video, author, socials }: CreatorProps) {
  const headlineNode = (
    <>
      {author.headlinePrefix ?? "Hi, I'm "}
      {author.headlineAccent && <em>{author.headlineAccent}</em>}
      {author.headlineSuffix}
    </>
  )

  return (
    <section className="creator" data-screen-label="Creator">
      <div className="creator-inner">
        <div className="lead">
          <VideoFrame {...video} />

          <div className="author">
            {author.eyebrow && (
              <span className="eyebrow">{author.eyebrow}</span>
            )}
            <h2>{headlineNode}</h2>
            {author.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            {(author.signName || author.signRole) && (
              <div className="sign">
                {author.signName}
                {author.signRole && <small>{author.signRole}</small>}
              </div>
            )}
          </div>
        </div>

        {socials && socials.accounts.length > 0 && (
          <div className="social-rail" aria-label="Find me online">
            <div className="rail-head">
              <div>
                {socials.eyebrow && (
                  <span className="eyebrow">{socials.eyebrow}</span>
                )}
              </div>
              {socials.heading && <h3>{socials.heading}</h3>}
              {socials.total && (
                <span className="total">
                  <strong>{socials.total.value}</strong> {socials.total.label}
                </span>
              )}
            </div>

            {socials.accounts.map((account) => {
              const meta = PLATFORM_META[account.platform]
              const cta = account.cta ?? meta.defaultCta
              const countLabel = account.countLabel ?? meta.defaultCountLabel
              return (
                <a
                  key={account.platform + account.url}
                  href={account.url}
                  className={`social-row ${meta.rowClass}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="glyph" aria-hidden="true">
                    <PlatformGlyph platform={account.platform} />
                  </span>
                  <span className="head">
                    <span className="platform">{meta.name}</span>
                    <span className="handle">{account.handle}</span>
                  </span>
                  <span className="count">
                    {account.count && <strong>{account.count}</strong>}
                    {countLabel}
                  </span>
                  <span className="go">
                    {cta} <span className="arrow">→</span>
                  </span>
                </a>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
