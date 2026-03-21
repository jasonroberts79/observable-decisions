import { auth } from "@/auth"
import { notFound } from "next/navigation"
import { DecisionForm } from "@/components/decision-form"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import type { Decision } from "@/lib/decisions/schema"

export const dynamic = "force-dynamic"

const API_BASE = process.env.DECISIONS_API_URL ?? "http://localhost:8000"

export default async function EditDecisionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session) return null

  let decision: Decision
  try {
    const res = await fetch(`${API_BASE}/api/decisions/${id}`, {
      headers: { "x-user-email": session.user?.email ?? "" },
      cache: "no-store",
    })
    if (!res.ok) throw new Error("Not found")
    decision = await res.json()
  } catch {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href={`/decisions/${id}`}
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
