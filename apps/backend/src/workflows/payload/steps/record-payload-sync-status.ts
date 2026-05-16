import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

export type SyncStatus = "success" | "failed"

export type SyncResult = {
  medusa_id: string
  status: SyncStatus
  error?: string
}

export type SyncResultsInput = { results: SyncResult[] }

const MAX_ERROR_LENGTH = 500

const buildMetadataPatch = (result: SyncResult, nowIso: string): Record<string, unknown> => {
  if (result.status === "success") {
    return {
      payload_synced_at: nowIso,
      payload_sync_status: "success",
      payload_sync_error: null,
    }
  }
  return {
    payload_sync_status: "failed",
    payload_sync_error: (result.error ?? "Unknown error").slice(0, MAX_ERROR_LENGTH),
    // payload_synced_at intentionally preserved — last *successful* sync time.
  }
}

export const recordPayloadSyncStatusInvoke = async (
  input: SyncResultsInput,
  { container }: { container: { resolve: (key: string) => unknown } }
): Promise<StepResponse<null>> => {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER) as {
    warn: (msg: string) => void
  }
  if (!input?.results?.length) return new StepResponse(null)

  try {
    const productService = container.resolve(Modules.PRODUCT) as {
      updateProducts: (
        id: string,
        data: { metadata: Record<string, unknown> }
      ) => Promise<unknown>
    }
    const query = container.resolve(ContainerRegistrationKeys.QUERY) as {
      graph: (args: unknown) => Promise<{ data: Array<{ id: string; metadata: Record<string, unknown> | null }> }>
    }
    const ids = Array.from(new Set(input.results.map((r) => r.medusa_id)))

    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "metadata"],
      filters: { id: ids },
    })

    const byId = new Map(products.map((p) => [p.id, p.metadata ?? {}]))
    const nowIso = new Date().toISOString()

    // Direct module-service call — bypasses updateProductsWorkflow, so no
    // product.updated event fires and we don't loop the sync subscriber.
    // Called per-product because metadata differs per row.
    for (const result of input.results) {
      const existing = byId.get(result.medusa_id)
      if (!existing) continue
      const merged = { ...existing, ...buildMetadataPatch(result, nowIso) }
      await productService.updateProducts(result.medusa_id, { metadata: merged })
    }
  } catch (err) {
    // Observability writes must never break the sync itself.
    logger.warn(
      `[record-payload-sync-status] failed to write metadata: ${(err as Error).message}`
    )
  }

  return new StepResponse(null)
}

export const recordPayloadSyncStatusStep = createStep(
  "record-payload-sync-status",
  recordPayloadSyncStatusInvoke
  // No compensation: sync-status writes are never rolled back.
)
