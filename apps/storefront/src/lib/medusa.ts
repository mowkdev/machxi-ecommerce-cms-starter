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
