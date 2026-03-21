import { auth } from "@/auth"
import { DecisionList } from "@/components/decision-list"
import type { DecisionMeta } from "@/lib/decisions/schema"
import Link from "next/link"
import { Plus } from "lucide-react"
import { headers } from "next/headers"

export const dynamic = "force-dynamic"

const API_BASE = process.env.DECISIONS_API_URL ?? "http://localhost:8000"

export default async function DecisionsPage() {
  const session = await auth()
  if (!session) return null

  let decisions: DecisionMeta[] = []
  let fetchError: string | null = null

  try {
    const res = await fetch(`${API_BASE}/api/decisions`, {
      headers: { "x-user-email": session.user?.email ?? "" },
      cache: "no-store",
    })
    if (!res.ok) throw new Error(`API responded with ${res.status}`)
    decisions = await res.json()
  } catch (err) {
    fetchError = String(err)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Decisions</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            All recorded decisions across types and domains.
          </p>
        </div>
        <Link
          href="/decisions/new"
          className="flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          New
        </Link>
      </div>

      {fetchError ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p className="font-medium">Could not load decisions</p>
          <p className="mt-1 text-red-600">{fetchError}</p>
          <p className="mt-2">
            Make sure the API backend is running and{" "}
            <code className="text-xs bg-red-100 px-1 rounded">DECISIONS_API_URL</code>{" "}
            is set correctly.
          </p>
        </div>
      ) : (
        <DecisionList decisions={decisions} />
      )}
    </div>
  )
}
