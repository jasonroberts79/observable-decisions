import { auth } from "@/auth"
import { getStorageAdapter } from "@/lib/storage"
import { DecisionList } from "@/components/decision-list"
import type { DecisionMeta } from "@/lib/decisions/schema"
import Link from "next/link"
import { Plus } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function DecisionsPage() {
  const session = await auth()
  if (!session) return null

  let decisions: DecisionMeta[] = []
  let storageError: string | null = null

  try {
    const adapter = getStorageAdapter(session)
    decisions = await adapter.list()
  } catch (err) {
    storageError = String(err)
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

      {storageError ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p className="font-medium">Storage not configured</p>
          <p className="mt-1 text-red-600">{storageError}</p>
          <p className="mt-2">
            <a href="/settings" className="underline">
              Go to Settings
            </a>{" "}
            to configure your storage backend.
          </p>
        </div>
      ) : (
        <DecisionList decisions={decisions} />
      )}
    </div>
  )
}
