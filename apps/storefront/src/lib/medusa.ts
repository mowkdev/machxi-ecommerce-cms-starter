import Medusa, { FetchArgs, FetchInput } from "@medusajs/js-sdk"

import { getLocaleHeader } from "@/lib/util/get-locale-header"

const MEDUSA_BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"

export const sdk = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  debug: process.env.NODE_ENV === "development",
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
})

const originalFetch = sdk.client.fetch.bind(sdk.client)

sdk.client.fetch = async <T>(
  input: FetchInput,
  init?: FetchArgs
): Promise<T> => {
  const headers = (init?.headers ?? {}) as Record<string, string | null>
  let localeHeader: Record<string, string | null> | undefined

  try {
    localeHeader = await getLocaleHeader()
    headers["x-medusa-locale"] ??= localeHeader["x-medusa-locale"]
  } catch {}

  init = {
    ...init,
    headers: {
      ...localeHeader,
      ...headers,
    },
  }

  return originalFetch(input, init)
}
