import type { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { PAYLOAD_MODULE } from "../../../../../modules/payload"
import type { PayloadModuleService } from "../../../../../modules/payload"

type CountsRow = {
  total: string
  failed: string
  last_synced_at: string | null
}

type FailureRow = {
  id: string
  title: string | null
  error: string | null
  updated_at: Date | string
}

const RECENT_FAILURES_LIMIT = 10

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  // Constant-time aggregates straight from Postgres — scales to large catalogs.
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as {
    raw: <T>(sql: string, bindings?: unknown[]) => Promise<{ rows: T[] }>
  }
  const payloadService = req.scope.resolve<PayloadModuleService>(PAYLOAD_MODULE)

  const [countsResult, failuresResult, payloadCount] = await Promise.all([
    pg.raw<CountsRow>(
      `SELECT
         COUNT(*)::text AS total,
         COUNT(*) FILTER (WHERE metadata->>'payload_sync_status' = 'failed')::text AS failed,
         MAX(metadata->>'payload_synced_at') AS last_synced_at
       FROM product
       WHERE deleted_at IS NULL`
    ),
    pg.raw<FailureRow>(
      `SELECT
         id,
         title,
         metadata->>'payload_sync_error' AS error,
         updated_at
       FROM product
       WHERE deleted_at IS NULL
         AND metadata->>'payload_sync_status' = 'failed'
       ORDER BY updated_at DESC
       LIMIT ?`,
      [RECENT_FAILURES_LIMIT]
    ),
    // Synced count = count of Payload docs that point at a Medusa product.
    // `limit: 0` returns just the totalDocs metadata without fetching rows.
    payloadService.find("products", { limit: 0 }),
  ])

  const row = countsResult.rows[0]
  const total = row ? Number(row.total) : 0
  const failed = row ? Number(row.failed) : 0
  const synced = payloadCount.totalDocs ?? 0
  const not_synced = Math.max(0, total - synced)

  res.status(200).json({
    total,
    synced,
    not_synced,
    failed,
    last_synced_at: row?.last_synced_at ?? null,
    recent_failures: failuresResult.rows.map((r) => ({
      id: r.id,
      title: r.title ?? "(untitled)",
      error: r.error ?? "Unknown error",
      updated_at:
        typeof r.updated_at === "string" ? r.updated_at : r.updated_at.toISOString(),
    })),
  })
}
