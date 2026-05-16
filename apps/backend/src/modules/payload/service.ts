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
   * Required by the Medusa→Payload virtual link runtime.
   * Given one or more Medusa product IDs, returns the matching Payload products
   * shaped under `payload_product` so the link layer can merge them in.
   */
  async list(filters: { product_id: string | string[] }): Promise<{ payload_product: PayloadProduct[] }> {
    const ids = Array.isArray(filters.product_id) ? filters.product_id : [filters.product_id]
    const result = await this.find<PayloadProduct>("products", {
      where: { medusa_id: { in: ids } },
      limit: ids.length,
      depth: 2,
    })
    return { payload_product: result.docs }
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
