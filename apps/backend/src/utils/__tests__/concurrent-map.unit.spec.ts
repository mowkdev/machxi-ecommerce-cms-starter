import { concurrentMap } from "../concurrent-map"

describe("concurrentMap", () => {
  it("preserves input order in the output", async () => {
    const result = await concurrentMap([1, 2, 3, 4, 5], 3, async (n) => n * 10)
    expect(result).toEqual([10, 20, 30, 40, 50])
  })

  it("returns [] for empty input", async () => {
    const fn = jest.fn()
    const result = await concurrentMap([], 5, fn)
    expect(result).toEqual([])
    expect(fn).not.toHaveBeenCalled()
  })

  it("caps in-flight calls to the concurrency limit", async () => {
    let inFlight = 0
    let observedMax = 0
    const result = await concurrentMap([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 3, async (n) => {
      inFlight += 1
      observedMax = Math.max(observedMax, inFlight)
      await new Promise((r) => setTimeout(r, 20))
      inFlight -= 1
      return n
    })
    expect(result).toHaveLength(10)
    expect(observedMax).toBeLessThanOrEqual(3)
    expect(observedMax).toBeGreaterThan(1) // proves it ran in parallel
  })

  it("propagates errors thrown inside fn", async () => {
    const fn = jest.fn(async (n: number) => {
      if (n === 2) throw new Error("boom")
      return n
    })
    await expect(concurrentMap([1, 2, 3], 2, fn)).rejects.toThrow("boom")
  })
})
