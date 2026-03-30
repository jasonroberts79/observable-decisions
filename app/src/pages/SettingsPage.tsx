import { CheckCircle, LogOut } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { providerLabel, signOut } from "@/lib/auth"

export function SettingsPage() {
  const { user } = useAuth()
  if (!user) return null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Settings</h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          Account and API configuration.
        </p>
      </div>

      {/* Account */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Account
        </h2>
        <div className="rounded-md border border-zinc-200 bg-white divide-y divide-zinc-100">
          <Row label="Email" value={user.email ?? "—"} />
          <Row label="Provider" value={providerLabel(user.providerData[0]?.providerId ?? "")} />
        </div>
      </section>

      {/* API Backend */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          API Backend
        </h2>
        <div className="rounded-md border border-zinc-200 bg-white divide-y divide-zinc-100">
          <Row label="Backend" value="Decisions API (FastAPI)" />
          <Row label="URL" value="(same origin)" />
        </div>
        <div className="flex items-start gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-800">
          <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <p>The API backend is linked. Decisions are stored via the API.</p>
        </div>
      </section>

      {/* Sign out — mobile only (desktop uses sidebar) */}
      <section className="sm:hidden">
        <button
          onClick={() => signOut()}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </section>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className="text-sm font-medium text-zinc-900">{value}</span>
    </div>
  )
}
