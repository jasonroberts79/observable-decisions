"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import Link from "next/link"
import Fuse from "fuse.js"
import { Search, X } from "lucide-react"
import { StatusBadge } from "@/components/status-badge"
import { formatDate } from "@/lib/utils"
import type { DecisionMeta, DecisionStatus } from "@/lib/decisions/schema"

const ALL_STATUSES: DecisionStatus[] = [
  "proposed",
  "accepted",
  "rejected",
  "deprecated",
  "superseded",
]

interface DecisionListProps {
  decisions: DecisionMeta[]
}

export function DecisionList({ decisions }: DecisionListProps) {
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<DecisionStatus | null>(null)
  const [cursor, setCursor] = useState(0)

  const fuse = useMemo(
    () =>
      new Fuse(decisions, {
        keys: ["title", "tags", "deciders"],
        threshold: 0.35,
        includeScore: true,
      }),
    [decisions],
  )

  const filtered = useMemo(() => {
    let result = query
      ? fuse.search(query).map((r) => r.item)
      : [...decisions]
    if (statusFilter) {
      result = result.filter((d) => d.status === statusFilter)
    }
    return result
  }, [query, statusFilter, decisions, fuse])

  // Reset cursor when results change
  useEffect(() => setCursor(0), [filtered.length])

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault()
        setCursor((c) => Math.min(c + 1, filtered.length - 1))
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault()
        setCursor((c) => Math.max(c - 1, 0))
      }
    },
    [filtered.length],
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [handleKey])

  const statusCounts = useMemo(() => {
    const counts: Partial<Record<DecisionStatus, number>> = {}
    for (const d of decisions) {
      counts[d.status] = (counts[d.status] ?? 0) + 1
    }
    return counts
  }, [decisions])

  return (
    <div className="space-y-4">
      {/* Search + filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search decisions…"
            className="w-full rounded-md border border-zinc-200 bg-white py-1.5 pl-8 pr-8 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setStatusFilter(null)}
            className={`rounded px-2 py-0.5 text-xs transition-colors ${
              statusFilter === null
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            All ({decisions.length})
          </button>
          {ALL_STATUSES.filter((s) => statusCounts[s]).map((s) => (
            <button
              key={s}
              onClick={() =>
                setStatusFilter(statusFilter === s ? null : s)
              }
              className={`rounded px-2 py-0.5 text-xs capitalize transition-colors ${
                statusFilter === s
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {s} ({statusCounts[s]})
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-md border border-dashed border-zinc-200 py-12 text-center text-sm text-zinc-400">
          {query || statusFilter
            ? "No decisions match your filters."
            : "No decisions yet. Create your first one."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-zinc-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs text-zinc-500">
                <th className="px-4 py-2.5 font-medium">Title</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="hidden px-3 py-2.5 font-medium sm:table-cell">
                  Date
                </th>
                <th className="hidden px-3 py-2.5 font-medium md:table-cell">
                  Tags
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map((d, i) => (
                <tr
                  key={d.id}
                  data-cursor={i === cursor}
                  className={`group transition-colors hover:bg-zinc-50 ${
                    i === cursor ? "bg-zinc-50" : "bg-white"
                  }`}
                >
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/decisions/${d.id}`}
                      className="font-medium text-zinc-900 hover:text-zinc-600 group-hover:underline decoration-zinc-300 underline-offset-2"
                    >
                      {d.title}
                    </Link>
                    {d.deciders.length > 0 && (
                      <p className="mt-0.5 text-xs text-zinc-400">
                        {d.deciders.join(", ")}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusBadge status={d.status} />
                  </td>
                  <td className="hidden px-3 py-2.5 text-xs text-zinc-500 sm:table-cell">
                    {formatDate(d.date)}
                  </td>
                  <td className="hidden px-3 py-2.5 md:table-cell">
                    {d.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {d.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500"
                          >
                            {tag}
                          </span>
                        ))}
                        {d.tags.length > 3 && (
                          <span className="text-xs text-zinc-400">
                            +{d.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length > 0 && (
        <p className="text-xs text-zinc-400">
          {filtered.length} decision{filtered.length !== 1 ? "s" : ""}
          {(query || statusFilter) && ` · j/k to navigate`}
        </p>
      )}
    </div>
  )
}
