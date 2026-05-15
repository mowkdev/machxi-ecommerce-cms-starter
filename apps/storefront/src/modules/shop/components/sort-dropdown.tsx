"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"

import { DEFAULT_SORT, SORT_OPTIONS, type SortKey } from "@/lib/shop-sort"

export function SortDropdown({ value }: { value: SortKey }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value as SortKey
    const params = new URLSearchParams(searchParams)
    if (next === DEFAULT_SORT) {
      params.delete("sort")
    } else {
      params.set("sort", next)
    }
    // Whenever sort changes, jump back to page 1 (drop /page/N from path).
    const trimmed = pathname.replace(/\/page\/\d+\/?$/, "")
    const qs = params.toString()
    startTransition(() => {
      router.push(qs ? `${trimmed}?${qs}` : trimmed)
    })
  }

  return (
    <label className="sort">
      Sort
      <select value={value} onChange={onChange} disabled={pending}>
        {SORT_OPTIONS.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}
