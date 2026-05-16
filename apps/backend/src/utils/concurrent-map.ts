/**
 * Bounded-concurrency async map. Like `Promise.all(items.map(fn))` but caps
 * in-flight calls to `concurrency`. Preserves input order in the output.
 *
 * If `fn` throws, the worker re-throws — wrap calls in try/catch inside `fn`
 * if you want partial-success semantics (which we do in the Payload sync
 * steps).
 */
export async function concurrentMap<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  if (!items.length) return []
  const results: R[] = new Array(items.length)
  let cursor = 0
  const worker = async () => {
    while (true) {
      const i = cursor
      cursor += 1
      if (i >= items.length) return
      results[i] = await fn(items[i]!, i)
    }
  }
  const workers = Math.max(1, Math.min(concurrency, items.length))
  await Promise.all(Array.from({ length: workers }, worker))
  return results
}
