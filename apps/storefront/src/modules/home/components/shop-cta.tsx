import Image from "next/image"

import LocalizedLink from "@/modules/common/components/localized-link"

export type ShopCtaImage = {
  src?: string
  alt?: string
  captionLeft?: string
  captionRight?: string
}

export type ShopCtaProps = {
  eyebrow?: string
  headlinePrefix?: string
  headlineAccent?: string
  headlineSuffix?: string
  paragraphs?: string[]
  ctaLabel: string
  ctaHref: string
  stamp?: {
    line1?: string
    line2?: string
    small?: string
  }
  stats?: { value: string; label: string }[]
  images?: [ShopCtaImage?, ShopCtaImage?, ShopCtaImage?]
}

function Polaroid({
  className,
  image,
}: {
  className: string
  image?: ShopCtaImage
}) {
  return (
    <div className={`pol ${className}`}>
      <div className="ph">
        {image?.src && (
          <Image
            src={image.src}
            alt={image.alt ?? ""}
            fill
            sizes="(max-width: 768px) 50vw, 33vw"
            className="object-cover"
          />
        )}
      </div>
      {(image?.captionLeft || image?.captionRight) && (
        <div className="cap">
          <span>{image?.captionLeft}</span>
          <span>{image?.captionRight}</span>
        </div>
      )}
    </div>
  )
}

export function ShopCta({
  eyebrow,
  headlinePrefix,
  headlineAccent,
  headlineSuffix,
  paragraphs = [],
  ctaLabel,
  ctaHref,
  stamp,
  stats = [],
  images = [],
}: ShopCtaProps) {
  return (
    <section className="shop-cta" data-screen-label="Visit shop">
      <div className="shop-cta-inner">
        <div className="img-stack" aria-hidden="true">
          <Polaroid className="p1" image={images[0]} />
          <Polaroid className="p2" image={images[1]} />
          <Polaroid className="p3" image={images[2]} />
          {stamp && (
            <div className="stamp">
              {stamp.line1}
              {stamp.line2 && (
                <>
                  <br />
                  {stamp.line2}
                </>
              )}
              {stamp.small && <small>{stamp.small}</small>}
            </div>
          )}
        </div>

        <div className="copy">
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h2>
            {headlinePrefix}
            {headlineAccent && <span className="accent">{headlineAccent}</span>}
            {headlineSuffix}
          </h2>
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}

          <LocalizedLink className="cta-big" href={ctaHref}>
            <span>{ctaLabel}</span>
            <span className="arrow">→</span>
          </LocalizedLink>

          {stats.length > 0 && (
            <div className="cta-stats">
              {stats.map((stat, i) => (
                <span key={i}>
                  <strong>{stat.value}</strong>
                  {stat.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
