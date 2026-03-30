import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Plus } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { listDecisions } from "@/lib/api"
import { DecisionList } from "@/components/decision-list"
import type { DecisionMeta } from "@/lib/decisions/schema"

export function DecisionsPage() {
  const { user } = useAuth()
  const [decisions, setDecisions] = useState<DecisionMeta[]>([])
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    listDecisions()
      .then(setDecisions)
      .catch((err) => setFetchError(String(err)))
      .finally(() => setLoading(false))
  }, [user])

  if (loading) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Decisions</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            All recorded decisions across types and domains.
          </p>
        </div>
        {/* Hidden on mobile — FAB in DecisionList handles it */}
        <Link
          to="/decisions/new"
          className="hidden sm:flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
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
            Make sure the API backend is running and reachable.
          </p>
        </div>
      ) : (
        <DecisionList decisions={decisions} />
      )}
    </div>
  )
}
