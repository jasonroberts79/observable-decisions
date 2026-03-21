import { CheckCircle, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { providerLabel } from "@/lib/auth"

export function SettingsPage() {
  const { user } = useAuth()
  if (!user) return null

  const apiUrl = import.meta.env.VITE_DECISIONS_API_URL ?? "(same origin)"
  const apiConfigured = !!import.meta.env.VITE_DECISIONS_API_URL

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
          <Row label="Email" value={user.userDetails ?? "\u2014"} />
          <Row label="Provider" value={providerLabel(user.identityProvider)} />
        </div>
      </section>

      {/* API Backend */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          API Backend
        </h2>
        <div className="rounded-md border border-zinc-200 bg-white divide-y divide-zinc-100">
          <Row label="Backend" value="Decisions API (FastAPI)" />
          <Row label="URL" value={apiUrl} />
        </div>
        <div
          className={`flex items-start gap-2 rounded-md border px-3 py-2.5 text-sm ${
            apiConfigured
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          {apiConfigured ? (
            <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          )}
          <p>
            {apiConfigured
              ? "The API backend is configured. Decisions are stored via the API."
              : "VITE_DECISIONS_API_URL is not set \u2014 API calls will be sent to the same origin. Set it to point to your API backend."}
          </p>
        </div>
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
