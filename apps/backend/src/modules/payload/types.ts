export interface PayloadModuleOptions {
  serverUrl: string
  apiKey: string
  userCollection?: string
}

export interface PayloadCollectionItem {
  id: string
  createdAt: string
  updatedAt: string
  medusa_id: string
  [key: string]: unknown
}

export type PayloadUpsertData = Record<string, unknown>

export interface PayloadQueryOptions {
  depth?: number
  locale?: string
  where?: Record<string, unknown>
  limit?: number
  page?: number
  sort?: string
}

export interface PayloadItemResult<T extends PayloadCollectionItem = PayloadCollectionItem> {
  doc: T
  message: string
}

export interface PayloadBulkResult<T extends PayloadCollectionItem = PayloadCollectionItem> {
  docs: T[]
  totalDocs: number
  limit: number
  page: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface PayloadApiErrorBody {
  errors?: Array<{ message: string; field?: string }>
  message?: string
}

export interface PayloadProductVariant {
  medusa_id: string
  title?: string
  sku?: string
  option_values?: Array<{ option_medusa_id: string; value: string }>
}

export interface PayloadProductOption {
  medusa_id: string
  title?: string
  values?: Array<{ value: string }>
}

export interface PayloadProduct extends PayloadCollectionItem {
  title?: string
  handle?: string
  subtitle?: string
  description?: unknown
  thumbnail?: { id: string; url?: string } | string
  images?: Array<{ image: { id: string; url?: string } | string }>
  seo?: { title?: string; description?: string; keywords?: string }
  options?: PayloadProductOption[]
  variants?: PayloadProductVariant[]
}

export type PayloadFetch = (input: string | URL, init?: RequestInit) => Promise<Response>

export interface PayloadServiceDependencies {
  fetch?: PayloadFetch
}
