import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { recordPayloadSyncStatusInvoke } from "../record-payload-sync-status"
import type { SyncResult } from "../record-payload-sync-status"

const invoke = recordPayloadSyncStatusInvoke

type CapturedUpdate = { id: string; data: { metadata: Record<string, unknown> } }

const buildContainer = (
  products: Array<{ id: string; metadata?: Record<string, unknown> | null }>,
  opts: { updateThrows?: boolean } = {}
) => {
  const updateCalls: CapturedUpdate[] = []
  const warn = jest.fn()
  const error = jest.fn()
  const updateProducts = jest.fn(async (id: string, data: { metadata: Record<string, unknown> }) => {
    if (opts.updateThrows) throw new Error("db down")
    updateCalls.push({ id, data })
    return { id, ...data }
  })
  const graph = jest.fn(async () => ({ data: products }))
  return {
    resolve: (key: string) => {
      if (key === Modules.PRODUCT) return { updateProducts }
      if (key === ContainerRegistrationKeys.QUERY) return { graph }
      if (key === ContainerRegistrationKeys.LOGGER) return { warn, error, info: jest.fn() }
      throw new Error(`unexpected resolve: ${key}`)
    },
    _updateCalls: updateCalls,
    _warn: warn,
  }
}

describe("recordPayloadSyncStatusStep", () => {
  it("writes success metadata and clears previous error", async () => {
    const container = buildContainer([
      {
        id: "prod_1",
        metadata: {
          other_key: "keep me",
          payload_sync_status: "failed",
          payload_sync_error: "stale error",
          payload_synced_at: "2025-01-01T00:00:00.000Z",
        },
      },
    ])
    const results: SyncResult[] = [{ medusa_id: "prod_1", status: "success" }]
    await invoke({ results }, { container })

    expect(container._updateCalls).toHaveLength(1)
    const meta = container._updateCalls[0]!.data.metadata
    expect(meta.other_key).toBe("keep me")
    expect(meta.payload_sync_status).toBe("success")
    expect(meta.payload_sync_error).toBeNull()
    expect(typeof meta.payload_synced_at).toBe("string")
    expect(Number.isNaN(Date.parse(meta.payload_synced_at as string))).toBe(false)
  })

  it("writes failed status and preserves prior payload_synced_at", async () => {
    const previousSyncedAt = "2025-01-02T10:00:00.000Z"
    const container = buildContainer([
      {
        id: "prod_2",
        metadata: {
          payload_synced_at: previousSyncedAt,
          payload_sync_status: "success",
          unrelated: 42,
        },
      },
    ])
    const results: SyncResult[] = [
      { medusa_id: "prod_2", status: "failed", error: "Payload 500" },
    ]
    await invoke({ results }, { container })

    expect(container._updateCalls).toHaveLength(1)
    const meta = container._updateCalls[0]!.data.metadata
    expect(meta.payload_sync_status).toBe("failed")
    expect(meta.payload_sync_error).toBe("Payload 500")
    expect(meta.payload_synced_at).toBe(previousSyncedAt) // preserved
    expect(meta.unrelated).toBe(42)
  })

  it("truncates very long error messages", async () => {
    const container = buildContainer([{ id: "prod_3", metadata: {} }])
    const longError = "x".repeat(2000)
    const results: SyncResult[] = [{ medusa_id: "prod_3", status: "failed", error: longError }]
    await invoke({ results }, { container })

    const meta = container._updateCalls[0]!.data.metadata
    expect((meta.payload_sync_error as string).length).toBeLessThanOrEqual(500)
  })

  it("is a no-op when results is empty", async () => {
    const container = buildContainer([])
    await invoke({ results: [] }, { container })
    expect(container._updateCalls).toHaveLength(0)
  })

  it("skips products no longer present in Medusa", async () => {
    const container = buildContainer([{ id: "prod_present", metadata: {} }])
    const results: SyncResult[] = [
      { medusa_id: "prod_present", status: "success" },
      { medusa_id: "prod_deleted", status: "success" },
    ]
    await invoke({ results }, { container })

    expect(container._updateCalls).toHaveLength(1)
    expect(container._updateCalls[0]!.id).toBe("prod_present")
  })

  it("logs but does not throw when metadata write fails", async () => {
    const container = buildContainer([{ id: "prod_4", metadata: {} }], { updateThrows: true })
    const results: SyncResult[] = [{ medusa_id: "prod_4", status: "success" }]
    await expect(invoke({ results }, { container })).resolves.toBeDefined()
    expect(container._warn).toHaveBeenCalled()
  })
})
