import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { startPayloadMockServer, type PayloadMockServer } from "../helpers/payload-mock-server"

jest.setTimeout(60_000)

medusaIntegrationTestRunner({
  testSuite: ({ api, getContainer }) => {
    let mock: PayloadMockServer

    beforeAll(async () => {
      mock = await startPayloadMockServer()
      process.env.PAYLOAD_SERVER_URL = mock.url
      const container = getContainer()
      const payloadService = container.resolve("payload") as {
        listPayloadIntegrationSettings: () => Promise<Array<{ id: string }>>
        createPayloadIntegrationSettings: (
          data: { api_key: string; user_collection: string }
        ) => Promise<unknown>
        clearSettingsCache: () => void
      }
      const existing = await payloadService.listPayloadIntegrationSettings()
      if (!existing.length) {
        await payloadService.createPayloadIntegrationSettings({
          api_key: "test-key",
          user_collection: "users",
        })
      }
      payloadService.clearSettingsCache()
    })

    afterAll(async () => {
      await mock.close()
    })

    beforeEach(() => {
      mock.reset()
    })

    it("bulk syncs unsynced products on POST /admin/payload/sync/products", async () => {
      // Seed two products with Payload returning "not found" so both look unsynced.
      mock.setHandler((req) => {
        if (req.method === "GET" && req.pathname === "/api/products") {
          return { status: 200, body: { docs: [], totalDocs: 0 } }
        }
        if (req.method === "POST" && req.pathname === "/api/products") {
          const body = (req.body as { medusa_id: string }) ?? { medusa_id: "" }
          return {
            status: 201,
            body: { doc: { id: `pl_${body.medusa_id}`, medusa_id: body.medusa_id, createdAt: "", updatedAt: "" }, message: "ok" },
          }
        }
        return { status: 200, body: {} }
      })
      const p1 = await api.post("/admin/products", { title: "A" }, adminHeaders())
      const p2 = await api.post("/admin/products", { title: "B" }, adminHeaders())
      await waitFor(() => mock.requests.filter((r) => r.method === "POST" && r.pathname === "/api/products").length >= 2)
      mock.reset()
      const resp = await api.post("/admin/payload/sync/products", {}, adminHeaders())
      expect(resp.status).toBe(202)
      expect(resp.data.event).toBe("products.sync-payload")
      await waitFor(() => mock.requests.some((r) => r.method === "GET" && r.pathname === "/api/products"))
    })

    function adminHeaders() {
      return { headers: { "x-medusa-access-token": getContainer().__test_admin_token__ ?? "" } }
    }
  },
})

async function waitFor(predicate: () => boolean, timeoutMs = 5000) {
  const start = Date.now()
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) throw new Error("waitFor timed out")
    await new Promise((r) => setTimeout(r, 50))
  }
}
