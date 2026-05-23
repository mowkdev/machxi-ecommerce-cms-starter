import PayloadModuleService from "../service"
import type { PayloadFetch, PayloadProduct } from "../types"

const OPTIONS = {
  serverUrl: "http://payload.local",
}

const DEFAULT_SETTINGS = {
  apiKey: "test-key",
  userCollection: "users",
}

function makeFetch(responses: Array<{ status?: number; body: unknown }>): {
  fetch: PayloadFetch
  calls: Array<{ url: string; init?: RequestInit }>
} {
  const calls: Array<{ url: string; init?: RequestInit }> = []
  let i = 0
  const fetch: PayloadFetch = async (input, init) => {
    calls.push({ url: String(input), init })
    const { status = 200, body } = responses[i++] ?? { body: {} }
    return new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    })
  }
  return { fetch, calls }
}

function makeService(
  responses: Array<{ status?: number; body: unknown }>,
  settings = DEFAULT_SETTINGS
) {
  const { fetch, calls } = makeFetch(responses)
  const service = new PayloadModuleService({}, OPTIONS, {
    fetch,
    getSettings: async () => settings,
  })
  return { service, calls }
}

describe("PayloadModuleService", () => {
  describe("makeRequest auth header", () => {
    it("sets Authorization: <userCollection> API-Key <apiKey>", async () => {
      const { service, calls } = makeService([{ body: { docs: [], totalDocs: 0 } }])
      await service.find<PayloadProduct>("products")
      const auth = (calls[0].init?.headers as Record<string, string>)?.Authorization
      expect(auth).toBe("users API-Key test-key")
    })

    it("uses the configured userCollection name", async () => {
      const { service, calls } = makeService(
        [{ body: { docs: [], totalDocs: 0 } }],
        { apiKey: "test-key", userCollection: "admins" }
      )
      await service.find<PayloadProduct>("products")
      expect((calls[0].init?.headers as Record<string, string>).Authorization).toBe("admins API-Key test-key")
    })
  })

  describe("create", () => {
    it("POSTs to /api/<collection> with JSON body", async () => {
      const doc = { id: "1", medusa_id: "p1", createdAt: "", updatedAt: "" }
      const { service, calls } = makeService([{ status: 201, body: { doc, message: "ok" } }])
      const result = await service.create<PayloadProduct>("products", { medusa_id: "p1" })
      expect(calls[0].url).toBe("http://payload.local/api/products")
      expect(calls[0].init?.method).toBe("POST")
      expect(calls[0].init?.body).toBe(JSON.stringify({ medusa_id: "p1" }))
      expect(result.doc.medusa_id).toBe("p1")
    })
  })

  describe("update", () => {
    it("PATCHes /api/<collection>/<id>", async () => {
      const doc = { id: "1", medusa_id: "p1", createdAt: "", updatedAt: "" }
      const { service, calls } = makeService([{ body: { doc, message: "ok" } }])
      await service.update<PayloadProduct>("products", "1", { title: "new" })
      expect(calls[0].url).toBe("http://payload.local/api/products/1")
      expect(calls[0].init?.method).toBe("PATCH")
      expect(calls[0].init?.body).toBe(JSON.stringify({ title: "new" }))
    })
  })

  describe("delete", () => {
    it("DELETEs /api/<collection>/<id>", async () => {
      const { service, calls } = makeService([{ body: { message: "deleted" } }])
      await service.delete("products", "1")
      expect(calls[0].url).toBe("http://payload.local/api/products/1")
      expect(calls[0].init?.method).toBe("DELETE")
    })
  })

  describe("find", () => {
    it("builds querystring from PayloadQueryOptions", async () => {
      const { service, calls } = makeService([{ body: { docs: [], totalDocs: 0 } }])
      await service.find<PayloadProduct>("products", {
        depth: 2,
        limit: 10,
        page: 1,
        where: { medusa_id: { equals: "p1" } },
      })
      const url = new URL(calls[0].url)
      expect(url.pathname).toBe("/api/products")
      expect(url.searchParams.get("depth")).toBe("2")
      expect(url.searchParams.get("limit")).toBe("10")
      expect(url.searchParams.get("page")).toBe("1")
      expect(url.searchParams.get("where[medusa_id][equals]")).toBe("p1")
    })

    it("supports where with $in arrays", async () => {
      const { service, calls } = makeService([{ body: { docs: [], totalDocs: 0 } }])
      await service.find<PayloadProduct>("products", {
        where: { medusa_id: { in: ["a", "b"] } },
      })
      const url = new URL(calls[0].url)
      expect(url.searchParams.getAll("where[medusa_id][in][]")).toEqual(["a", "b"])
    })
  })

  describe("list (used by virtual link)", () => {
    it("returns a flat array of docs with product_id alias for link join", async () => {
      const doc = { id: "1", medusa_id: "p1", createdAt: "", updatedAt: "" }
      const { service } = makeService([{ body: { docs: [doc], totalDocs: 1 } }])
      const result = await service.list({ product_id: "p1" })
      // Flat array (not wrapped in { payload_product }); product_id is the
      // join field RemoteJoiner uses to match docs to parent products.
      // Top-level `id` is stripped because Medusa's translation pipeline
      // recursively collects every `id` it sees and queries by them; Payload's
      // numeric IDs aren't valid Medusa IDs and 500 the translation query.
      const { id: _id, ...docWithoutId } = doc
      expect(result).toEqual([{ ...docWithoutId, product_id: "p1" }])
    })

    it("accepts an array of product_ids", async () => {
      const docs = [
        { id: "1", medusa_id: "p1", createdAt: "", updatedAt: "" },
        { id: "2", medusa_id: "p2", createdAt: "", updatedAt: "" },
      ]
      const { service, calls } = makeService([{ body: { docs, totalDocs: 2 } }])
      const result = await service.list({ product_id: ["p1", "p2"] })
      const url = new URL(calls[0].url)
      expect(url.searchParams.getAll("where[medusa_id][in][]")).toEqual(["p1", "p2"])
      expect(result).toHaveLength(2)
      expect(result[0]).toMatchObject({ medusa_id: "p1", product_id: "p1" })
    })
  })

  describe("error handling", () => {
    it("throws PayloadApiError on non-2xx with status and body", async () => {
      const { service } = makeService([
        { status: 422, body: { errors: [{ message: "validation failed", field: "medusa_id" }] } },
      ])
      await expect(service.create("products", { medusa_id: "" })).rejects.toMatchObject({
        name: "PayloadApiError",
        status: 422,
        body: { errors: [{ message: "validation failed", field: "medusa_id" }] },
      })
    })

    it("wraps fetch network errors as PayloadApiError with status 0", async () => {
      const fetch: PayloadFetch = async () => {
        throw new Error("ECONNREFUSED")
      }
      const service = new PayloadModuleService({}, OPTIONS, {
        fetch,
        getSettings: async () => DEFAULT_SETTINGS,
      })
      await expect(service.find("products")).rejects.toMatchObject({
        name: "PayloadApiError",
        status: 0,
      })
    })
  })

})
