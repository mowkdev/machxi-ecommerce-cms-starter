"use client"

import { CSSProperties, useState } from "react"

export type VideoFrameProps = {
  youtubeId: string
  title: string
  posterImage?: string
  ariaLabel?: string
}

export function VideoFrame({
  youtubeId,
  title,
  posterImage,
  ariaLabel = "Play featured video",
}: VideoFrameProps) {
  const [isLive, setIsLive] = useState(false)

  const posterStyle: CSSProperties | undefined = posterImage
    ? { backgroundImage: `url(${posterImage})` }
    : undefined

  return (
    <button
      type="button"
      className={`video-frame${isLive ? " is-live" : ""}`}
      onClick={() => setIsLive(true)}
      aria-label={ariaLabel}
    >
      {!isLive && (
        <>
          <span className="poster" aria-hidden="true" style={posterStyle} />
          <span className="play-btn" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M6 4.5v15a1 1 0 0 0 1.55.83l11-7.5a1 1 0 0 0 0-1.66l-11-7.5A1 1 0 0 0 6 4.5z" />
            </svg>
          </span>
        </>
      )}
      {isLive && (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`}
          title={title}
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      )}
    </button>
  )
}
