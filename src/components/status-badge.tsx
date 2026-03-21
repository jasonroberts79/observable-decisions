import { cn } from "@/lib/utils"
import type { DecisionStatus } from "@/lib/decisions/schema"

const styles: Record<DecisionStatus, string> = {
  proposed: "bg-zinc-100 text-zinc-600",
  accepted: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
  deprecated: "bg-amber-50 text-amber-700",
  superseded: "bg-violet-50 text-violet-700",
}

export function StatusBadge({ status }: { status: DecisionStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium capitalize",
        styles[status],
      )}
    >
      {status}
    </span>
  )
}
