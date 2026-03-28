import { useState, useEffect } from "react"
import { useParams, Link, Navigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getDecision } from "@/lib/api"
import { DecisionForm } from "@/components/decision-form"
import type { Decision } from "@/lib/decisions/schema"

export function EditDecisionPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [decision, setDecision] = useState<Decision | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !id) return
    getDecision(id)
      .then(setDecision)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id, user])

  if (loading) return null
  if (notFound) return <Navigate to="/decisions" replace />
  if (!decision) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to={`/decisions/${id}`}
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>
      </div>
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Edit Decision</h1>
        <p className="mt-0.5 font-mono text-xs text-zinc-400">{decision.id}</p>
      </div>
      <DecisionForm mode="edit" initial={decision} />
    </div>
  )
}
