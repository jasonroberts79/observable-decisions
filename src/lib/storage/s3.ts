import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import type { StorageAdapter } from "./types"
import type { Decision, DecisionMeta } from "@/lib/decisions/schema"
import { toMeta } from "@/lib/decisions/schema"

export interface S3Config {
  bucket: string
  region: string
  accessKeyId: string
  secretAccessKey: string
  prefix?: string
}

export class S3Adapter implements StorageAdapter {
  private client: S3Client
  private bucket: string
  private prefix: string

  constructor(config: S3Config) {
    this.client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    })
    this.bucket = config.bucket
    this.prefix = config.prefix ?? "decisions/"
  }

  private key(id: string) {
    return `${this.prefix}${id}.json`
  }

  async list(): Promise<DecisionMeta[]> {
    const res = await this.client.send(
      new ListObjectsV2Command({ Bucket: this.bucket, Prefix: this.prefix }),
    )

    const metas: DecisionMeta[] = []
    for (const obj of res.Contents ?? []) {
      if (!obj.Key?.endsWith(".json")) continue
      try {
        const decision = await this.get(
          obj.Key.replace(this.prefix, "").replace(".json", ""),
        )
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
    const res = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: this.key(id) }),
    )
    const body = await res.Body?.transformToString()
    if (!body) throw new Error(`Decision ${id} not found`)
    return JSON.parse(body)
  }

  async put(id: string, data: Decision): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: this.key(id),
        Body: JSON.stringify(data, null, 2),
        ContentType: "application/json",
      }),
    )
  }

  async delete(id: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: this.key(id) }),
    )
  }

  async share(id: string): Promise<string> {
    const url = await getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: this.key(id) }),
      { expiresIn: 7 * 24 * 3600 },
    )
    return url
  }
}
