import handler, { config } from "../product-option-created"

jest.mock("../../workflows/payload/create-payload-product-option", () => ({
  createPayloadProductOptionWorkflow: { run: jest.fn() },
}))

describe("product-option-created", () => {
  it("subscribes to product-option.created", () => {
    expect(config.event).toBe("product-option.created")
  })

  it("calls createPayloadProductOptionWorkflow", async () => {
    const query = jest.fn().mockResolvedValue({
      data: [{ id: "opt_1", title: "Size", product_id: "prod_1", values: [{ value: "S" }] }],
    })
    const container = {
      resolve: (k: string) =>
        k === "query" ? { graph: query } : { error: jest.fn(), info: jest.fn() },
    } as never
    const mock = jest.requireMock("../../workflows/payload/create-payload-product-option") as {
      createPayloadProductOptionWorkflow: { run: jest.Mock }
    }
    mock.createPayloadProductOptionWorkflow.run.mockResolvedValueOnce({ result: null })
    await handler({ event: { data: { id: "opt_1" } }, container })
    expect(mock.createPayloadProductOptionWorkflow.run).toHaveBeenCalled()
  })
})
