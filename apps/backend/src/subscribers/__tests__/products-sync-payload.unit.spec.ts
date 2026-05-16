import handler, { config } from "../products-sync-payload"

jest.mock("../../workflows/payload/create-payload-products", () => ({
  createPayloadProductsWorkflow: { run: jest.fn() },
}))

describe("products-sync-payload subscriber", () => {
  it("subscribes to products.sync-payload", () => {
    expect(config.event).toBe("products.sync-payload")
  })

  it("queries all products and dispatches create workflow in batches", async () => {
    const query = jest.fn().mockResolvedValue({
      data: [
        { id: "p1", title: "A" },
        { id: "p2", title: "B" },
      ],
    })
    const findUnsynced = jest.fn().mockResolvedValueOnce([{ medusa_id: "p1", product_id: "p1" }])
    const container = {
      resolve: (k: string) => {
        if (k === "query") return { graph: query }
        if (k === "payload") return { list: findUnsynced }
        return { error: jest.fn(), info: jest.fn() }
      },
    } as never
    const mock = jest.requireMock("../../workflows/payload/create-payload-products") as {
      createPayloadProductsWorkflow: { run: jest.Mock }
    }
    mock.createPayloadProductsWorkflow.run.mockResolvedValueOnce({ result: [] })
    await handler({ event: { data: {} }, container })
    expect(mock.createPayloadProductsWorkflow.run).toHaveBeenCalledWith({
      container,
      input: { products: [{ id: "p2", title: "B" }] },
    })
  })
})
