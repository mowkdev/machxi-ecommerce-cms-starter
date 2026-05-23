import Medusa, { FetchArgs, FetchInput } from "@medusajs/js-sdk"
import { unstable_cache } from "next/cache"
import { getPayload } from "payload"
import config from "@payload-config"

import { getLocaleHeader } from "@/lib/util/get-locale-header"

const MEDUSA_BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"

// The publishable key lives in the Payload `medusa-integration` global so it
// can be rotated via the admin UI without redeploying. Reads are cached for 60
// seconds and tag-invalidated on save (see the global's afterChange hook).
const getIntegrationConfig = unstable_cache(
  async () => {
    const payload = await getPayload({ config })
    const global = await payload.findGlobal({ slug: "medusa-integration" })
    return { publishableKey: global.publishableKey ?? null }
  },
  ["medusa-integration"],
  { tags: ["medusa-integration"], revalidate: 60 }
)

let cachedSdk: Medusa | null = null
let cachedKey: string | null = null

export async function getMedusaSdk(): Promise<Medusa> {
  const { publishableKey } = await getIntegrationConfig()
  if (!publishableKey) {
    throw new Error(
      "Medusa publishable key not configured. Open Payload Admin → Globals → Medusa Integration to set it."
    )
  }

  if (cachedSdk && cachedKey === publishableKey) {
    return cachedSdk
  }

  const sdk = new Medusa({
    baseUrl: MEDUSA_BACKEND_URL,
    debug: process.env.NODE_ENV === "development",
    publishableKey,
  })

  const originalFetch = sdk.client.fetch.bind(sdk.client)
  sdk.client.fetch = async <T>(
    input: FetchInput,
    init?: FetchArgs
  ): Promise<T> => {
    let localeHeader: Record<string, string> = {}
    try {
      localeHeader = await getLocaleHeader()
    } catch {}

    return originalFetch(input, {
      ...init,
      headers: {
        ...localeHeader,
        ...(init?.headers ?? {}),
      },
    })
  }

  cachedSdk = sdk
  cachedKey = publishableKey
  return sdk
}
