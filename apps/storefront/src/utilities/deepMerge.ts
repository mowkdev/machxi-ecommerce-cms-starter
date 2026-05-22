function isObject(item: unknown): item is Record<string, unknown> {
  return Boolean(item && typeof item === "object" && !Array.isArray(item))
}

export default function deepMerge<T extends Record<string, unknown>, S extends Record<string, unknown>>(
  target: T,
  source: S,
): T & S {
  const output: Record<string, unknown> = { ...target }

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      const sourceValue = (source as Record<string, unknown>)[key]
      const targetValue = (target as Record<string, unknown>)[key]

      if (isObject(sourceValue)) {
        if (!(key in target)) {
          output[key] = sourceValue
        } else if (isObject(targetValue)) {
          output[key] = deepMerge(
            targetValue as Record<string, unknown>,
            sourceValue as Record<string, unknown>,
          )
        } else {
          output[key] = sourceValue
        }
      } else {
        output[key] = sourceValue
      }
    })
  }

  return output as T & S
}
