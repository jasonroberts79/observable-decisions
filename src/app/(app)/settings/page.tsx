import { auth } from "@/auth"
import { CheckCircle, AlertCircle } from "lucide-react"

export default async function SettingsPage() {
  const session = await auth()
  if (!session) return null

  const provider = (session as { provider?: string }).provider ?? "unknown"
  const apiUrl = process.env.DECISIONS_API_URL ?? "http://localhost:8000"
  const apiConfigured = !!process.env.DECISIONS_API_URL

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
          <Row label="Email" value={session.user?.email ?? "—"} />
          <Row label="Name" value={session.user?.name ?? "—"} />
          <Row label="Provider" value={providerLabel(provider)} />
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
              : "DECISIONS_API_URL is not set — defaulting to http://localhost:8000. Set it in your environment to point to your API backend."}
          </p>
        </div>
      </section>

      {/* Configuration help */}
      {!apiConfigured && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Configure API backend
          </h2>
          <div className="rounded-md border border-zinc-200 bg-white p-4 text-sm text-zinc-600 space-y-2">
            <p>
              Set the following environment variable to point to your Decisions
              API:
            </p>
            <pre className="rounded bg-zinc-50 border border-zinc-200 p-3 text-xs font-mono text-zinc-700 overflow-auto">
              {`DECISIONS_API_URL=http://localhost:8000`}
            </pre>
            <p>
              The API backend itself needs{" "}
              <code className="text-xs bg-zinc-100 px-1 rounded">
                AZURE_STORAGE_CONNECTION_STRING
              </code>{" "}
              configured. See the <code className="text-xs bg-zinc-100 px-1 rounded">api/.env.example</code> file.
            </p>
          </div>
        </section>
      )}
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

function providerLabel(provider: string): string {
  const map: Record<string, string> = {
    google: "Google",
    "microsoft-entra-id": "Microsoft",
    "azure-ad": "Microsoft",
    github: "GitHub",
  }
  return map[provider] ?? provider
}
