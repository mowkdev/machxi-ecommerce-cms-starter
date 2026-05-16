import { PayloadApiError } from "./errors"
import type {
  PayloadBulkResult,
  PayloadCollectionItem,
  PayloadFetch,
  PayloadItemResult,
  PayloadModuleOptions,
  PayloadProduct,
  PayloadQueryOptions,
  PayloadServiceDependencies,
  PayloadUpsertData,
} from "./types"

class PayloadModuleService {
  protected readonly options_: PayloadModuleOptions
  protected readonly fetch_: PayloadFetch

  constructor(_container: unknown, options: PayloadModuleOptions, deps?: PayloadServiceDependencies) {
    this.options_ = options
    this.fetch_ = deps?.fetch ?? ((globalThis as unknown as { fetch: PayloadFetch }).fetch)
  }

  protected getAuthHeader(): string {
    const collection = this.options_.userCollection || "users"
    return `${collection} API-Key ${this.options_.apiKey}`
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
    let response: Response
    try {
      response = await this.fetch_(url, {
        ...rest,
        headers: {
          "Content-Type": "application/json",
          Authorization: this.getAuthHeader(),
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
    return result.docs.map((doc) => ({ ...doc, product_id: doc.medusa_id }))
  }
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
