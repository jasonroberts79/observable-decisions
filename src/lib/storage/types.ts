import type { Decision, DecisionMeta } from "@/lib/decisions/schema"

export type StorageProvider = "google-drive" | "onedrive" | "s3" | "azure-blob"

export interface StorageAdapter {
  list(): Promise<DecisionMeta[]>
  get(id: string): Promise<Decision>
  put(id: string, data: Decision): Promise<void>
  delete(id: string): Promise<void>
  /** Share a decision file with a user by email. Returns a share URL. */
  share(id: string, email?: string): Promise<string>
}
