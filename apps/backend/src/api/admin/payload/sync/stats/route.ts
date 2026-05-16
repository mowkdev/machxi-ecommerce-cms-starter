import type { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type ProductRow = {
  id: string
  title: string | null
  updated_at: string
  metadata: Record<string, unknown> | null
  payload_product: { id: string } | null
}

type FailureRow = {
  id: string
  title: string
  error: string
  updated_at: string
}

const RECENT_FAILURES_LIMIT = 10

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  // Aggregated server-side (Medusa lacks first-class metadata-filter primitives
  // here). Acceptable for catalogs into the low thousands; can be replaced with
  // query.index() once we need it.
  const result = await query.graph({
    entity: "product",
    fields: ["id", "title", "updated_at", "metadata", "payload_product.*"],
  })
  const products = result.data as unknown as ProductRow[]

  let synced = 0
  let failed = 0
  let lastSyncedAtMs = 0
  const failures: FailureRow[] = []

  for (const p of products) {
    const meta = (p.metadata ?? {}) as {
      payload_synced_at?: string
      payload_sync_status?: string
      payload_sync_error?: string
    }

    if (p.payload_product) synced += 1
    if (meta.payload_sync_status === "failed") {
      failed += 1
      failures.push({
        id: p.id,
        title: p.title ?? "(untitled)",
        error: meta.payload_sync_error ?? "Unknown error",
        updated_at: p.updated_at,
      })
    }

    if (meta.payload_synced_at) {
      const ms = Date.parse(meta.payload_synced_at)
      if (!Number.isNaN(ms) && ms > lastSyncedAtMs) lastSyncedAtMs = ms
    }
  }

  failures.sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at))

  res.status(200).json({
    total: products.length,
    synced,
    not_synced: products.length - synced,
    failed,
    last_synced_at: lastSyncedAtMs ? new Date(lastSyncedAtMs).toISOString() : null,
    recent_failures: failures.slice(0, RECENT_FAILURES_LIMIT),
  })
}
