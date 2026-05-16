import handler, { config } from "../product-option-deleted"

jest.mock("../../workflows/payload/delete-payload-product-option", () => ({
  deletePayloadProductOptionWorkflow: { run: jest.fn() },
}))

describe("product-option-deleted", () => {
  it("subscribes to product-option.deleted", () => {
    expect(config.event).toBe("product-option.deleted")
  })

  it("calls deletePayloadProductOptionWorkflow with product_id and option_id", async () => {
    const container = {
      resolve: () => ({ error: jest.fn(), info: jest.fn() }),
    } as never
    const mock = jest.requireMock("../../workflows/payload/delete-payload-product-option") as {
      deletePayloadProductOptionWorkflow: { run: jest.Mock }
    }
    mock.deletePayloadProductOptionWorkflow.run.mockResolvedValueOnce({ result: null })
    await handler({
      event: { data: { id: "opt_1", product_id: "prod_1" } },
      container,
    })
    expect(mock.deletePayloadProductOptionWorkflow.run).toHaveBeenCalledWith({
      container,
      input: { product_id: "prod_1", option_id: "opt_1" },
    })
  })
})
