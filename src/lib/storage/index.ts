import type { Session } from "next-auth"
import { GoogleDriveAdapter } from "./google-drive"
import { OneDriveAdapter } from "./onedrive"
import { S3Adapter } from "./s3"
import { AzureBlobAdapter } from "./azure-blob"
import type { StorageAdapter } from "./types"

export type { StorageAdapter, StorageProvider } from "./types"

export function getStorageAdapter(session: Session): StorageAdapter {
  const provider = (session as { provider?: string }).provider

  if (provider === "google") {
    const token = (session as { accessToken?: string }).accessToken
    if (!token) throw new Error("Missing Google access token")
    return new GoogleDriveAdapter(token)
  }

  if (provider === "microsoft-entra-id" || provider === "azure-ad") {
    const token = (session as { accessToken?: string }).accessToken
    if (!token) throw new Error("Missing Microsoft access token")
    return new OneDriveAdapter(token)
  }

  // Fallback: S3 or Azure Blob via environment variables
  if (process.env.AWS_S3_BUCKET) {
    return new S3Adapter({
      bucket: process.env.AWS_S3_BUCKET,
      region: process.env.AWS_REGION ?? "us-east-1",
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
      prefix: `users/${session.user?.email ?? "default"}/`,
    })
  }

  if (process.env.AZURE_STORAGE_CONNECTION_STRING) {
    return new AzureBlobAdapter({
      connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
      container: process.env.AZURE_STORAGE_CONTAINER ?? "decisions",
      prefix: `users/${session.user?.email ?? "default"}/`,
    })
  }

  throw new Error(
    "No storage backend configured. Sign in with Google or Microsoft for automatic storage, or set AWS_S3_BUCKET / AZURE_STORAGE_CONNECTION_STRING.",
  )
}
