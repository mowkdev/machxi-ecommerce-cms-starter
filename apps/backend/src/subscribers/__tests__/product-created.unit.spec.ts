import handler, { config } from "../product-created"

describe("product-created subscriber", () => {
  const baseEvent = { data: { id: "prod_1" }, name: "product.created" } as never

  function buildContainer(workflowRun: jest.Mock, productList: jest.Mock) {
    return {
      resolve: (key: string) => {
        if (key === "query") return { graph: productList }
        if (key === "logger") return { error: jest.fn(), info: jest.fn() }
        throw new Error(`unexpected resolve ${key}`)
      },
    }
  }

  it("subscribes to product.created", () => {
    expect(config.event).toBe("product.created")
  })

  it("invokes createPayloadProductsWorkflow with the fetched product", async () => {
    const run = jest.fn().mockResolvedValue({ result: [] })
    const productList = jest.fn().mockResolvedValue({
      data: [{ id: "prod_1", title: "Hat", options: [], variants: [] }],
    })
    const container = buildContainer(run, productList)
    const moduleMock = jest.requireMock("../../workflows/payload/create-payload-products") as {
      createPayloadProductsWorkflow: { run: jest.Mock }
    }
    moduleMock.createPayloadProductsWorkflow.run.mockResolvedValueOnce({ result: [] })

    await handler({ event: baseEvent, container } as never)

    expect(moduleMock.createPayloadProductsWorkflow.run).toHaveBeenCalledWith({
      container,
      input: { products: [{ id: "prod_1", title: "Hat", options: [], variants: [] }] },
    })
  })

  it("swallows workflow errors and logs them", async () => {
    const error = new Error("payload down")
    const errLogger = jest.fn()
    const container = {
      resolve: (key: string) => {
        if (key === "query")
          return { graph: jest.fn().mockResolvedValue({ data: [{ id: "prod_1" }] }) }
        if (key === "logger") return { error: errLogger, info: jest.fn() }
        throw new Error(key)
      },
    } as never
    const moduleMock = jest.requireMock("../../workflows/payload/create-payload-products") as {
      createPayloadProductsWorkflow: { run: jest.Mock }
    }
    moduleMock.createPayloadProductsWorkflow.run.mockRejectedValueOnce(error)

    await expect(handler({ event: baseEvent, container })).resolves.toBeUndefined()
    expect(errLogger).toHaveBeenCalled()
  })
})

jest.mock("../../workflows/payload/create-payload-products", () => ({
  createPayloadProductsWorkflow: { run: jest.fn() },
}))
