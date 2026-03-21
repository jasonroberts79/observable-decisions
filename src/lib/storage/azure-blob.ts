import {
  BlobServiceClient,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  StorageSharedKeyCredential,
} from "@azure/storage-blob"
import type { StorageAdapter } from "./types"
import type { Decision, DecisionMeta } from "@/lib/decisions/schema"
import { toMeta } from "@/lib/decisions/schema"

export interface AzureConfig {
  connectionString: string
  container: string
  prefix?: string
}

export class AzureBlobAdapter implements StorageAdapter {
  private serviceClient: BlobServiceClient
  private container: string
  private prefix: string

  constructor(config: AzureConfig) {
    this.serviceClient = BlobServiceClient.fromConnectionString(
      config.connectionString,
    )
    this.container = config.container
    this.prefix = config.prefix ?? "decisions/"
  }

  private blobName(id: string) {
    return `${this.prefix}${id}.json`
  }

  private containerClient() {
    return this.serviceClient.getContainerClient(this.container)
  }

  async list(): Promise<DecisionMeta[]> {
    const client = this.containerClient()
    const metas: DecisionMeta[] = []

    for await (const blob of client.listBlobsFlat({ prefix: this.prefix })) {
      if (!blob.name.endsWith(".json")) continue
      try {
        const id = blob.name.replace(this.prefix, "").replace(".json", "")
        const decision = await this.get(id)
        metas.push(toMeta(decision))
      } catch {
        // skip malformed
      }
    }

    return metas.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
  }

  async get(id: string): Promise<Decision> {
    const blob = this.containerClient().getBlockBlobClient(this.blobName(id))
    const res = await blob.download()
    const body = await streamToString(res.readableStreamBody!)
    return JSON.parse(body)
  }

  async put(id: string, data: Decision): Promise<void> {
    const blob = this.containerClient().getBlockBlobClient(this.blobName(id))
    const body = JSON.stringify(data, null, 2)
    await blob.upload(body, Buffer.byteLength(body), {
      blobHTTPHeaders: { blobContentType: "application/json" },
    })
  }

  async delete(id: string): Promise<void> {
    const blob = this.containerClient().getBlockBlobClient(this.blobName(id))
    await blob.deleteIfExists()
  }

  async share(id: string): Promise<string> {
    const client = this.containerClient()
    const blob = client.getBlockBlobClient(this.blobName(id))

    // Extract account name and key from connection string for SAS generation
    const accountMatch = this.serviceClient.accountName
    const cred = this.serviceClient.credential

    if (!(cred instanceof StorageSharedKeyCredential)) {
      // Fall back to blob URL without SAS if credential type doesn't support it
      return blob.url
    }

    const expiry = new Date()
    expiry.setDate(expiry.getDate() + 7)

    const sas = generateBlobSASQueryParameters(
      {
        containerName: this.container,
        blobName: this.blobName(id),
        permissions: BlobSASPermissions.parse("r"),
        expiresOn: expiry,
      },
      cred,
    )

    return `${blob.url}?${sas.toString()}`
  }
}

async function streamToString(
  readable: NodeJS.ReadableStream,
): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of readable) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string))
  }
  return Buffer.concat(chunks).toString("utf8")
}
