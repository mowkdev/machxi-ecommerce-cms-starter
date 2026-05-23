import { MedusaService } from "@medusajs/framework/utils"

import { PayloadApiError, PayloadConfigMissingError } from "./errors"
import PayloadIntegrationSettings from "./models/integration-settings"
import type {
  PayloadBulkResult,
  PayloadCollectionItem,
  PayloadFetch,
  PayloadIntegrationConfig,
  PayloadItemResult,
  PayloadModuleOptions,
  PayloadProduct,
  PayloadQueryOptions,
  PayloadServiceDependencies,
  PayloadUpsertData,
} from "./types"

const SETTINGS_CACHE_TTL_MS = 60_000

class PayloadModuleService extends MedusaService({
  PayloadIntegrationSettings,
}) {
  protected readonly options_: PayloadModuleOptions
  protected readonly fetch_: PayloadFetch
  private readonly getSettingsOverride_?: () => Promise<PayloadIntegrationConfig>
  private settingsCache_?: { value: PayloadIntegrationConfig; expires: number }

  constructor(container: unknown, options: PayloadModuleOptions, deps?: PayloadServiceDependencies) {
    super(...arguments)
    this.options_ = options
    this.fetch_ = deps?.fetch ?? ((globalThis as unknown as { fetch: PayloadFetch }).fetch)
    this.getSettingsOverride_ = deps?.getSettings
  }

  /**
   * Resolve `{ apiKey, userCollection }` from the singleton DB row, with a
   * 60-second in-memory cache to avoid hitting Postgres on every Payload
   * request. Tests can inject a stub via `deps.getSettings`.
   */
  protected async getSettings(): Promise<PayloadIntegrationConfig> {
    if (this.getSettingsOverride_) return this.getSettingsOverride_()

    const now = Date.now()
    if (this.settingsCache_ && this.settingsCache_.expires > now) {
      return this.settingsCache_.value
    }

    const rows = await this.listPayloadIntegrationSettings()
    const row = rows[0]
    if (!row?.api_key) {
      throw new PayloadConfigMissingError()
    }
    const value: PayloadIntegrationConfig = {
      apiKey: row.api_key,
      userCollection: row.user_collection || "users",
    }
    this.settingsCache_ = { value, expires: now + SETTINGS_CACHE_TTL_MS }
    return value
  }

  /** Drop the in-memory settings cache so the next call hits Postgres. */
  public clearSettingsCache(): void {
    this.settingsCache_ = undefined
  }

  protected async getAuthHeader(): Promise<string> {
    const { apiKey, userCollection } = await this.getSettings()
    return `${userCollection} API-Key ${apiKey}`
  }

  protected buildUrl(path: string, query?: PayloadQueryOptions): string {
    const url = new URL(path, this.options_.serverUrl)
    if (query) {
      for (const [k, v] of Object.entries(serializeQuery(query))) {
        if (Array.isArray(v)) {
          for (const item of v) url.searchParams.append(`${k}[]`, String(item))
        } else if (v !== undefined && v !== null) {
          url.searchParams.set(k, String(v))
        }
      }
    }
    return url.toString()
  }

  protected async makeRequest<T>(
    path: string,
    init: RequestInit & { query?: PayloadQueryOptions } = {}
  ): Promise<T> {
    const { query, headers, ...rest } = init
    const url = this.buildUrl(path, query)
    const authHeader = await this.getAuthHeader()
    let response: Response
    try {
      response = await this.fetch_(url, {
        ...rest,
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
          ...(headers as Record<string, string> | undefined),
        },
      })
    } catch (err) {
      throw new PayloadApiError((err as Error).message || "Payload request failed", {
        status: 0,
        url,
      })
    }

    if (!response.ok) {
      let body: unknown
      try {
        body = await response.json()
      } catch {
        body = undefined
      }
      throw new PayloadApiError(`Payload request failed with status ${response.status}`, {
        status: response.status,
        url,
        body: body as { errors?: Array<{ message: string; field?: string }>; message?: string },
      })
    }

    return (await response.json()) as T
  }

  async create<T extends PayloadCollectionItem = PayloadCollectionItem>(
    collection: string,
    data: PayloadUpsertData
  ): Promise<PayloadItemResult<T>> {
    return this.makeRequest<PayloadItemResult<T>>(`/api/${collection}`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async update<T extends PayloadCollectionItem = PayloadCollectionItem>(
    collection: string,
    id: string,
    data: PayloadUpsertData
  ): Promise<PayloadItemResult<T>> {
    return this.makeRequest<PayloadItemResult<T>>(`/api/${collection}/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  }

  async delete(collection: string, id: string): Promise<{ message: string }> {
    return this.makeRequest<{ message: string }>(`/api/${collection}/${encodeURIComponent(id)}`, {
      method: "DELETE",
    })
  }

  async find<T extends PayloadCollectionItem = PayloadCollectionItem>(
    collection: string,
    options?: PayloadQueryOptions
  ): Promise<PayloadBulkResult<T>> {
    return this.makeRequest<PayloadBulkResult<T>>(`/api/${collection}`, {
      method: "GET",
      query: options,
    })
  }

  /**
   * Called by Medusa's RemoteQuery whenever a query references the virtual
   * `payload_product` link. Must return a FLAT ARRAY of docs (not wrapped in
   * the alias) — RemoteJoiner reads each doc's `product_id` field to match
   * docs back to their parent Medusa products. Each doc therefore carries
   * `product_id` (aliased from Payload's `medusa_id`).
   *
   * Payload's auto-generated `id` fields (top-level + every nested array
   * item) are stripped before returning: Medusa's translation pipeline
   * recursively collects every `id` it sees and queries `translations` by
   * `reference_id IN (...)`, which 500s on non-Medusa-shaped IDs.
   */
  async list(
    filters: { product_id: string | string[] }
  ): Promise<Array<PayloadProduct & { product_id: string }>> {
    const ids = Array.isArray(filters.product_id) ? filters.product_id : [filters.product_id]
    if (!ids.length) return []
    const result = await this.find<PayloadProduct>("products", {
      where: { medusa_id: { in: ids } },
      limit: ids.length,
      depth: 2,
    })
    return result.docs.map((doc) => ({
      ...stripPayloadIds(doc),
      product_id: doc.medusa_id,
    }))
  }
}

function stripPayloadIds<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(stripPayloadIds) as unknown as T
  }
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) {
      if (k === "id") continue
      out[k] = stripPayloadIds(v)
    }
    return out as T
  }
  return value
}

function serializeQuery(query: PayloadQueryOptions): Record<string, string | string[] | number | undefined> {
  const out: Record<string, string | string[] | number | undefined> = {}
  if (query.depth !== undefined) out.depth = query.depth
  if (query.locale !== undefined) out.locale = query.locale
  if (query.limit !== undefined) out.limit = query.limit
  if (query.page !== undefined) out.page = query.page
  if (query.sort !== undefined) out.sort = query.sort
  if (query.where) flattenWhere(query.where, "where", out)
  return out
}

function flattenWhere(
  obj: Record<string, unknown>,
  prefix: string,
  out: Record<string, string | string[] | number | undefined>
) {
  for (const [k, v] of Object.entries(obj)) {
    const key = `${prefix}[${k}]`
    if (v === null || v === undefined) continue
    if (Array.isArray(v)) {
      out[key] = v.map(String)
    } else if (typeof v === "object") {
      flattenWhere(v as Record<string, unknown>, key, out)
    } else {
      out[key] = String(v)
    }
  }
}

export default PayloadModuleService
