import handler, { config } from "../product-deleted"

jest.mock("../../workflows/payload/delete-payload-products", () => ({
  deletePayloadProductsWorkflow: { run: jest.fn() },
}))

describe("product-deleted subscriber", () => {
  it("subscribes to product.deleted", () => {
    expect(config.event).toBe("product.deleted")
  })

  it("calls deletePayloadProductsWorkflow with the deleted id", async () => {
    const container = {
      resolve: () => ({ error: jest.fn(), info: jest.fn() }),
    } as never
    const mock = jest.requireMock("../../workflows/payload/delete-payload-products") as {
      deletePayloadProductsWorkflow: { run: jest.Mock }
    }
    mock.deletePayloadProductsWorkflow.run.mockResolvedValueOnce({ result: [] })
    await handler({ event: { data: { id: "prod_1" } }, container } as never)
    expect(mock.deletePayloadProductsWorkflow.run).toHaveBeenCalledWith({
      container,
      input: { ids: ["prod_1"] },
    })
  })
})
