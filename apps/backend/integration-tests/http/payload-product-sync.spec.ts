import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { startPayloadMockServer, type PayloadMockServer } from "../helpers/payload-mock-server"

jest.setTimeout(60_000)

medusaIntegrationTestRunner({
  testSuite: ({ api, getContainer }) => {
    let mock: PayloadMockServer

    beforeAll(async () => {
      mock = await startPayloadMockServer()
      process.env.PAYLOAD_SERVER_URL = mock.url
      // Seed the integration settings row that the module service reads at
      // request time (the module options no longer carry apiKey).
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
      mock.setHandler((req) => {
        if (req.method === "GET" && req.pathname === "/api/products") {
          return { status: 200, body: { docs: [], totalDocs: 0 } }
        }
        if (req.method === "POST" && req.pathname === "/api/products") {
          const body = (req.body as { medusa_id: string }) ?? { medusa_id: "" }
          return {
            status: 201,
            body: { doc: { id: `pl_${body.medusa_id}`, ...body, createdAt: "", updatedAt: "" }, message: "ok" },
          }
        }
        if (req.method === "PATCH" && req.pathname.startsWith("/api/products/")) {
          return { status: 200, body: { doc: { id: req.pathname.split("/").pop(), medusa_id: "x", createdAt: "", updatedAt: "" }, message: "ok" } }
        }
        if (req.method === "DELETE" && req.pathname.startsWith("/api/products/")) {
          return { status: 200, body: { message: "deleted" } }
        }
        return { status: 404, body: { message: "not found" } }
      })
    })

    it("creates a Payload product when a Medusa product is created", async () => {
      const created = await api.post(
        "/admin/products",
        { title: "Hat", options: [], variants: [] },
        adminHeaders()
      )
      expect(created.status).toBe(200)
      // Allow the event bus to dispatch.
      await waitFor(() => mock.requests.some((r) => r.method === "POST" && r.pathname === "/api/products"))
      const postReq = mock.requests.find((r) => r.method === "POST" && r.pathname === "/api/products")!
      expect((postReq.body as { medusa_id: string }).medusa_id).toBe(created.data.product.id)
      expect(postReq.headers.authorization).toBe("users API-Key test-key")
    })

    it("updates the Payload product when a Medusa product is updated", async () => {
      const { data } = await api.post("/admin/products", { title: "Cap" }, adminHeaders())
      await waitFor(() => mock.requests.some((r) => r.method === "POST" && r.pathname === "/api/products"))
      mock.reset()
      mock.setHandler((req) => {
        if (req.method === "GET" && req.pathname === "/api/products") {
          return { status: 200, body: { docs: [{ id: "pl_1", medusa_id: data.product.id, createdAt: "", updatedAt: "" }], totalDocs: 1 } }
        }
        if (req.method === "PATCH") return { status: 200, body: { doc: { id: "pl_1" }, message: "ok" } }
        return { status: 404, body: {} }
      })
      await api.post(`/admin/products/${data.product.id}`, { title: "Cap v2" }, adminHeaders())
      await waitFor(() => mock.requests.some((r) => r.method === "PATCH" && r.pathname === "/api/products/pl_1"))
    })

    it("deletes the Payload product when a Medusa product is deleted", async () => {
      const { data } = await api.post("/admin/products", { title: "Gone" }, adminHeaders())
      await waitFor(() => mock.requests.some((r) => r.method === "POST"))
      mock.reset()
      mock.setHandler((req) => {
        if (req.method === "GET" && req.pathname === "/api/products") {
          return { status: 200, body: { docs: [{ id: "pl_1", medusa_id: data.product.id, createdAt: "", updatedAt: "" }], totalDocs: 1 } }
        }
        if (req.method === "DELETE") return { status: 200, body: { message: "ok" } }
        return { status: 404, body: {} }
      })
      await api.delete(`/admin/products/${data.product.id}`, adminHeaders())
      await waitFor(() => mock.requests.some((r) => r.method === "DELETE" && r.pathname === "/api/products/pl_1"))
    })

    it("merges Payload data via the virtual link on read", async () => {
      const { data } = await api.post("/admin/products", { title: "Boots" }, adminHeaders())
      await waitFor(() => mock.requests.some((r) => r.method === "POST"))
      mock.reset()
      mock.setHandler((req) => {
        if (req.method === "GET" && req.pathname === "/api/products") {
          return {
            status: 200,
            body: {
              docs: [{ id: "pl_b", medusa_id: data.product.id, title: "Boots from Payload", createdAt: "", updatedAt: "" }],
              totalDocs: 1,
            },
          }
        }
        return { status: 200, body: {} }
      })
      const read = await api.get(
        `/admin/products/${data.product.id}?fields=id,title,+payload_product.*`,
        adminHeaders()
      )
      expect(read.data.product.payload_product?.title).toBe("Boots from Payload")
    })

    function adminHeaders() {
      return { headers: { "x-medusa-access-token": getContainer().__test_admin_token__ ?? "" } }
    }
  },
})

async function waitFor(predicate: () => boolean, timeoutMs = 5000) {
  const start = Date.now()
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error("waitFor timed out")
    }
    await new Promise((r) => setTimeout(r, 50))
  }
}
