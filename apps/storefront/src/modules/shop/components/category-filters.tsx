"use client"

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

const CAT_LINKS = [
  { label: "Rods", n: "14", current: true },
  { label: "Reels & Lines", n: "09" },
  { label: "Flies & Lures", n: "42" },
  { label: "Accessories", n: "11" },
  { label: "Workshop & Repair", n: "04" },
  { label: "Sale", n: "03", accent: true },
]

const INITIAL_TAGS = [
  "Cedar",
  "Moss",
  "€40 – €220",
  "7'6\"–8'6\"",
  "9' standard",
  "Medium",
  "In stock",
]

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
        setLo((cur) => Math.min(val, hi - 10))
      } else {
        setHi((cur) => Math.max(val, lo + 10))
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

function GridIcon() {
  return (
    <svg viewBox="0 0 12 12" fill="currentColor">
      <rect x="0" y="0" width="5" height="5" />
      <rect x="7" y="0" width="5" height="5" />
      <rect x="0" y="7" width="5" height="5" />
      <rect x="7" y="7" width="5" height="5" />
    </svg>
  )
}

function ListIcon() {
  return (
    <svg viewBox="0 0 12 12" fill="currentColor">
      <rect x="0" y="1" width="12" height="2" />
      <rect x="0" y="5" width="12" height="2" />
      <rect x="0" y="9" width="12" height="2" />
    </svg>
  )
}

export function CategorySidebar() {
  const [swatches, setSwatches] = useState(SWATCHES.map((s) => ({ ...s })))

  return (
    <aside className="side" aria-label="Filters">
      <div className="grp">
        <h4>
          Category <span className="count">14</span>
        </h4>
        <ul className="cat-nav">
          {CAT_LINKS.map((c) => (
            <li key={c.label}>
              <a
                href="#"
                className={cn(c.current && "current")}
                style={
                  c.accent
                    ? { color: "var(--accent-deep)", opacity: 1 }
                    : undefined
                }
              >
                {c.label} <span className="n">{c.n}</span>
              </a>
            </li>
          ))}
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

export function ResultsBar() {
  const [view, setView] = useState<"grid" | "list">("grid")
  return (
    <div className="results-bar">
      <div className="count">
        Showing <strong>09</strong> of 14 rods
      </div>
      <div className="controls">
        <label className="sort">
          Sort
          <select defaultValue="newest">
            <option value="newest">Newest first</option>
            <option value="lo">Price · low to high</option>
            <option value="hi">Price · high to low</option>
            <option value="loved">Best loved</option>
          </select>
        </label>
        <div className="view" role="group" aria-label="View">
          <button
            type="button"
            className={cn(view === "grid" && "on")}
            aria-label="Grid"
            onClick={() => setView("grid")}
          >
            <GridIcon />
          </button>
          <button
            type="button"
            className={cn(view === "list" && "on")}
            aria-label="List"
            onClick={() => setView("list")}
          >
            <ListIcon />
          </button>
        </div>
      </div>
    </div>
  )
}

export function ActiveTags() {
  const [tags, setTags] = useState(INITIAL_TAGS)
  if (tags.length === 0) return null
  return (
    <div className="active-tags">
      {tags.map((t) => (
        <span key={t} className="tag">
          {t}
          <button
            type="button"
            className="x"
            aria-label={`Remove ${t}`}
            onClick={() => setTags((cur) => cur.filter((x) => x !== t))}
          >
            ×
          </button>
        </span>
      ))}
    </div>
  )
}
