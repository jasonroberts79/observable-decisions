import { auth } from "@/auth"
import { CheckCircle, AlertCircle } from "lucide-react"

export default async function SettingsPage() {
  const session = await auth()
  if (!session) return null

  const provider = (session as { provider?: string }).provider ?? "unknown"

  const storageInfo = getStorageInfo(provider)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Settings</h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          Account and storage configuration.
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

      {/* Storage */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Storage
        </h2>
        <div className="rounded-md border border-zinc-200 bg-white divide-y divide-zinc-100">
          <Row label="Backend" value={storageInfo.name} />
          <Row label="Location" value={storageInfo.location} />
        </div>
        <div
          className={`flex items-start gap-2 rounded-md border px-3 py-2.5 text-sm ${
            storageInfo.configured
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          {storageInfo.configured ? (
            <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          )}
          <p>{storageInfo.message}</p>
        </div>
      </section>

      {/* S3 config */}
      {!storageInfo.configured && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Configure S3 fallback
          </h2>
          <div className="rounded-md border border-zinc-200 bg-white p-4 text-sm text-zinc-600 space-y-2">
            <p>
              Set the following environment variables to use AWS S3 as a storage
              backend:
            </p>
            <pre className="rounded bg-zinc-50 border border-zinc-200 p-3 text-xs font-mono text-zinc-700 overflow-auto">
              {`AWS_S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...`}
            </pre>
            <p>Or for Azure Blob Storage:</p>
            <pre className="rounded bg-zinc-50 border border-zinc-200 p-3 text-xs font-mono text-zinc-700 overflow-auto">
              {`AZURE_STORAGE_CONNECTION_STRING=...
AZURE_STORAGE_CONTAINER=decisions`}
            </pre>
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

function getStorageInfo(provider: string): {
  name: string
  location: string
  configured: boolean
  message: string
} {
  if (provider === "google") {
    return {
      name: "Google Drive",
      location: "Observable Decisions folder",
      configured: true,
      message:
        'Your decisions are stored in a folder named "Observable Decisions" in your Google Drive.',
    }
  }
  if (provider === "microsoft-entra-id" || provider === "azure-ad") {
    return {
      name: "OneDrive",
      location: "Apps/Observable Decisions",
      configured: true,
      message:
        'Your decisions are stored in the "Observable Decisions" folder in your OneDrive.',
    }
  }
  if (process.env.AWS_S3_BUCKET) {
    return {
      name: "AWS S3",
      location: `s3://${process.env.AWS_S3_BUCKET}`,
      configured: true,
      message: `Decisions are stored in S3 bucket "${process.env.AWS_S3_BUCKET}" under your user prefix.`,
    }
  }
  if (process.env.AZURE_STORAGE_CONNECTION_STRING) {
    return {
      name: "Azure Blob Storage",
      location: process.env.AZURE_STORAGE_CONTAINER ?? "decisions",
      configured: true,
      message: "Decisions are stored in Azure Blob Storage.",
    }
  }
  return {
    name: "Not configured",
    location: "—",
    configured: false,
    message:
      "No storage backend is available for your account. Sign in with Google or Microsoft for automatic storage, or configure S3/Azure via environment variables.",
  }
}
