import { HttpTypes } from "@medusajs/types"
import { NextRequest, NextResponse } from "next/server"
import createIntlMiddleware from "next-intl/middleware"

import { COUNTRY_CODE_COOKIE_NAME } from "@/lib/data/cookies"
import { routing } from "@/i18n/routing"
import { getMedusaSdk } from "@/lib/medusa"

const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || "us"

const intlMiddleware = createIntlMiddleware(routing)

const regionMapCache = {
  regionMap: new Map<string, HttpTypes.StoreRegion>(),
  regionMapUpdated: Date.now(),
}

async function getRegionMap() {
  const { regionMap, regionMapUpdated } = regionMapCache

  if (
    !regionMap.keys().next().value ||
    regionMapUpdated < Date.now() - 3600 * 1000
  ) {
    // Goes through getMedusaSdk so the publishable key resolves from the
    // Payload Medusa Integration global rather than env.
    const sdk = await getMedusaSdk()
    const { regions } = await sdk.client.fetch<{
      regions: HttpTypes.StoreRegion[]
    }>(`/store/regions`, {
      method: "GET",
      cache: "force-cache",
      next: { revalidate: 3600, tags: ["regions"] },
    })

    if (!regions?.length) {
      throw new Error(
        "No regions found. Please set up regions in your Medusa Admin."
      )
    }

    regions.forEach((region: HttpTypes.StoreRegion) => {
      region.countries?.forEach((c) => {
        regionMapCache.regionMap.set(c.iso_2 ?? "", region)
      })
    })

    regionMapCache.regionMapUpdated = Date.now()
  }

  return regionMapCache.regionMap
}

/**
 * Determines the country code from the cookie, then Vercel IP header,
 * then the configured default region.
 */
async function getCountryCode(
  request: NextRequest,
  regionMap: Map<string, HttpTypes.StoreRegion | number>
) {
  try {
    const cookieCountryCode = request.cookies
      .get(COUNTRY_CODE_COOKIE_NAME)
      ?.value?.toLowerCase()
    if (cookieCountryCode && regionMap.has(cookieCountryCode)) {
      return cookieCountryCode
    }

    const vercelCountryCode = request.headers
      .get("x-vercel-ip-country")
      ?.toLowerCase()
    if (vercelCountryCode && regionMap.has(vercelCountryCode)) {
      return vercelCountryCode
    }

    if (regionMap.has(DEFAULT_REGION)) {
      return DEFAULT_REGION
    }

    const firstKey = regionMap.keys().next().value
    if (firstKey) {
      return firstKey
    }

    return null
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "Middleware.ts: Error getting the country code. Did you set up regions in your Medusa Admin and define a MEDUSA_BACKEND_URL environment variable?"
      )
    }
    return null
  }
}

/**
 * Country code (region/currency) is tracked in a cookie — see the migration
 * guide at https://docs.medusajs.com/resources/nextjs-starter/guides/remove-country-code.
 * Locale (language) is tracked in the URL via next-intl. The two axes are
 * independent; next-intl runs first to handle locale redirects, then we
 * apply the region cookie.
 */
export async function middleware(request: NextRequest) {
  // Static assets bypass everything.
  if (request.nextUrl.pathname.includes(".")) {
    return NextResponse.next()
  }

  // Hand off to next-intl: if no locale prefix is present it returns a
  // redirect to `/<defaultLocale>/...`; otherwise a rewrite + headers.
  const intlResponse = intlMiddleware(request)

  // If next-intl is redirecting (no locale in URL), just return — the region
  // cookie will be set on the next request (which will hit the locale-prefixed
  // path and fall through to the region logic below).
  if (intlResponse.headers.get("location")) {
    return intlResponse
  }

  const cacheIdCookie = request.cookies.get("_medusa_cache_id")
  const cacheId = cacheIdCookie?.value || crypto.randomUUID()

  const regionMap = await getRegionMap()

  if (!regionMap) {
    return new NextResponse(
      "No valid regions configured. Please set up regions with countries in your Medusa Admin.",
      { status: 500 }
    )
  }

  const countryCode = await getCountryCode(request, regionMap)

  if (!countryCode) {
    return new NextResponse(
      "No valid regions configured. Please set up regions with countries in your Medusa Admin.",
      { status: 500 }
    )
  }

  // Build a response that carries next-intl's rewrite + headers and our
  // region cookies layered on top.
  const response = intlResponse

  if (!cacheIdCookie) {
    response.cookies.set("_medusa_cache_id", cacheId, {
      maxAge: 60 * 60 * 24,
    })
  }

  const cookieCountryCode = request.cookies.get(
    COUNTRY_CODE_COOKIE_NAME
  )?.value
  if (!cookieCountryCode || cookieCountryCode !== countryCode) {
    response.cookies.set(COUNTRY_CODE_COOKIE_NAME, countryCode, {
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: false,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    })
  }

  return response
}

// Node runtime is required because we read the Medusa publishable key from the
// Payload global via the Local API — Edge runtime can't import payload.
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|assets|png|svg|jpg|jpeg|gif|webp|admin|next).*)",
  ],
  runtime: "nodejs",
}
