"use client"

import LocalizedLink from "@/modules/common/components/localized-link"
import { HttpTypes } from "@medusajs/types"
import { useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

const SWATCHES = [
  { value: "cedar", label: "Cedar", color: "#a06438", on: true },
  { value: "ink", label: "Ink", color: "#0c1a26" },
  { value: "moss", label: "Moss", color: "#5a6f4a", on: true },
  { value: "slate", label: "Slate", color: "#6a7b89" },
  { value: "copper", label: "Copper", color: "#c08949" },
  { value: "bone", label: "Bone", color: "#e4dccb" },
]

const TYPE_FILTERS = [
  { label: "Fly rods", num: "08", checked: true },
  { label: "Spin rods", num: "04", checked: true },
  { label: "Travel · 4-piece", num: "05" },
  { label: "Custom builds", num: "02" },
]

const LENGTH_FILTERS = [
  { label: "7' & under", num: "02" },
  { label: "7'6\"–8'6\"", num: "04", checked: true },
  { label: "9' (standard)", num: "06", checked: true },
  { label: "9'6\" & over", num: "02" },
]

const ACTION_FILTERS = [
  { label: "Slow · full-flex", num: "03" },
  { label: "Medium", num: "06", checked: true },
  { label: "Medium-fast", num: "04" },
  { label: "Fast", num: "01" },
]

const AVAIL_FILTERS = [
  { label: "In stock", num: "11", checked: true },
  { label: "Made to order", num: "03" },
]

function pad(n: number) {
  return String(n).padStart(2, "0")
}

function PriceRange() {
  const rangeRef = useRef<HTMLDivElement>(null)
  const [lo, setLo] = useState(40)
  const [hi, setHi] = useState(220)
  const dragging = useRef<"lo" | "hi" | null>(null)
  const min = 0
  const max = 300

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const r = rangeRef.current?.getBoundingClientRect()
      if (!r || !dragging.current) return
      let pct = (e.clientX - r.left) / r.width
      pct = Math.max(0, Math.min(1, pct))
      const val = Math.round(min + pct * (max - min))
      if (dragging.current === "lo") {
        setLo(() => Math.min(val, hi - 10))
      } else {
        setHi(() => Math.max(val, lo + 10))
      }
    }
    const onUp = () => {
      dragging.current = null
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
  }, [lo, hi])

  return (
    <>
      <div className="price-row">
        <span>
          <span className="from">€{lo}</span> —{" "}
          <span className="to">€{hi}</span>
        </span>
        <span>EUR</span>
      </div>
      <div
        className="range"
        ref={rangeRef}
        style={
          {
            "--lo": lo,
            "--hi": hi,
            "--min": min,
            "--max": max,
          } as React.CSSProperties
        }
      >
        <div className="track" />
        <div className="fill" />
        <button
          type="button"
          className="thumb lo"
          aria-label="Minimum price"
          onMouseDown={(e) => {
            e.preventDefault()
            dragging.current = "lo"
          }}
        />
        <button
          type="button"
          className="thumb hi"
          aria-label="Maximum price"
          onMouseDown={(e) => {
            e.preventDefault()
            dragging.current = "hi"
          }}
        />
      </div>
      <div className="range-ticks">
        <span>€0</span>
        <span>€100</span>
        <span>€200</span>
        <span>€300+</span>
      </div>
    </>
  )
}

export function ShopSidebar({
  categories,
  activeHandle,
  totalCount,
}: {
  categories: HttpTypes.StoreProductCategory[]
  activeHandle: string
  totalCount: number
}) {
  const [swatches, setSwatches] = useState(SWATCHES.map((s) => ({ ...s })))

  const topLevel = categories.filter((c) => !c.parent_category)

  return (
    <aside className="side" aria-label="Filters">
      <div className="grp">
        <h4>
          Category <span className="count">{pad(topLevel.length + 1)}</span>
        </h4>
        <ul className="cat-nav">
          <li>
            <LocalizedLink
              href="/shop/all"
              className={cn(activeHandle === "all" && "current")}
            >
              All products <span className="n">{pad(totalCount)}</span>
            </LocalizedLink>
          </li>
          {topLevel.map((c) => {
            const productCount = c.products?.length ?? 0
            return (
              <li key={c.id}>
                <LocalizedLink
                  href={`/shop/${c.handle}`}
                  className={cn(c.handle === activeHandle && "current")}
                >
                  {c.name} <span className="n">{pad(productCount)}</span>
                </LocalizedLink>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="grp">
        <h4>Type</h4>
        <ul className="chk">
          {TYPE_FILTERS.map((f) => (
            <li key={f.label}>
              <label>
                <input type="checkbox" defaultChecked={f.checked} />
                <span className="box" />
                {f.label} <span className="num">{f.num}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div className="grp">
        <h4>
          Wrap colour <span className="count">2 / 6</span>
        </h4>
        <div className="swatch-grid">
          {swatches.map((s, i) => (
            <button
              key={s.value}
              type="button"
              className={cn("sw", s.on && "on")}
              data-val={s.value}
              onClick={() =>
                setSwatches((cur) =>
                  cur.map((c, j) => (j === i ? { ...c, on: !c.on } : c))
                )
              }
            >
              <span className="dot" style={{ background: s.color }} />
              <span className="lbl">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grp">
        <h4>
          Price <span className="count">€</span>
        </h4>
        <PriceRange />
      </div>

      <div className="grp">
        <h4>Length</h4>
        <ul className="chk">
          {LENGTH_FILTERS.map((f) => (
            <li key={f.label}>
              <label>
                <input type="checkbox" defaultChecked={f.checked} />
                <span className="box" />
                {f.label} <span className="num">{f.num}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div className="grp">
        <h4>Action</h4>
        <ul className="chk">
          {ACTION_FILTERS.map((f) => (
            <li key={f.label}>
              <label>
                <input type="checkbox" defaultChecked={f.checked} />
                <span className="box" />
                {f.label} <span className="num">{f.num}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div className="grp">
        <h4>Availability</h4>
        <ul className="chk">
          {AVAIL_FILTERS.map((f) => (
            <li key={f.label}>
              <label>
                <input type="checkbox" defaultChecked={f.checked} />
                <span className="box" />
                {f.label} <span className="num">{f.num}</span>
              </label>
            </li>
          ))}
        </ul>
        <button className="clear" type="button">
          Clear all filters
        </button>
      </div>
    </aside>
  )
}
