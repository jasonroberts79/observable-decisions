import { DecisionForm } from "@/components/decision-form"

export default function NewDecisionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">New Decision</h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          Record a new decision in ADR format.
        </p>
      </div>
      <DecisionForm mode="create" />
    </div>
  )
}
