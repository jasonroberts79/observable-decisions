import { google } from "googleapis"
import type { StorageAdapter } from "./types"
import type { Decision, DecisionMeta } from "@/lib/decisions/schema"
import { toMeta } from "@/lib/decisions/schema"

const FOLDER_NAME = "Observable Decisions"

export class GoogleDriveAdapter implements StorageAdapter {
  private drive: ReturnType<typeof google.drive>
  private folderId: string | null = null

  constructor(accessToken: string) {
    const auth = new google.auth.OAuth2()
    auth.setCredentials({ access_token: accessToken })
    this.drive = google.drive({ version: "v3", auth })
  }

  private async getOrCreateFolder(): Promise<string> {
    if (this.folderId) return this.folderId

    const res = await this.drive.files.list({
      q: `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: "files(id)",
      spaces: "drive",
    })

    if (res.data.files?.length) {
      this.folderId = res.data.files[0].id!
      return this.folderId
    }

    const folder = await this.drive.files.create({
      requestBody: {
        name: FOLDER_NAME,
        mimeType: "application/vnd.google-apps.folder",
      },
      fields: "id",
    })

    this.folderId = folder.data.id!
    return this.folderId
  }

  async list(): Promise<DecisionMeta[]> {
    const folderId = await this.getOrCreateFolder()

    const res = await this.drive.files.list({
      q: `'${folderId}' in parents and mimeType='application/json' and trashed=false`,
      fields: "files(id,description,modifiedTime)",
      orderBy: "modifiedTime desc",
      pageSize: 1000,
    })

    return (res.data.files ?? [])
      .filter((f) => f.description)
      .map((f) => {
        try {
          return JSON.parse(f.description!) as DecisionMeta
        } catch {
          return null
        }
      })
      .filter(Boolean) as DecisionMeta[]
  }

  async get(id: string): Promise<Decision> {
    const fileId = await this.findFileId(id)

    const res = await this.drive.files.get(
      { fileId, alt: "media" },
      { responseType: "json" },
    )

    return res.data as unknown as Decision
  }

  async put(id: string, data: Decision): Promise<void> {
    const folderId = await this.getOrCreateFolder()
    const body = JSON.stringify(data, null, 2)
    const description = JSON.stringify(toMeta(data))
    const existingId = await this.findFileId(id).catch(() => null)

    if (existingId) {
      await this.drive.files.update({
        fileId: existingId,
        requestBody: { description },
        media: { mimeType: "application/json", body },
      })
    } else {
      await this.drive.files.create({
        requestBody: {
          name: `${id}.json`,
          parents: [folderId],
          description,
          mimeType: "application/json",
        },
        media: { mimeType: "application/json", body },
      })
    }
  }

  async delete(id: string): Promise<void> {
    const fileId = await this.findFileId(id).catch(() => null)
    if (fileId) {
      await this.drive.files.delete({ fileId })
    }
  }

  async share(id: string, email?: string): Promise<string> {
    const fileId = await this.findFileId(id)

    if (email) {
      await this.drive.permissions.create({
        fileId,
        requestBody: {
          role: "reader",
          type: "user",
          emailAddress: email,
        },
      })
    } else {
      await this.drive.permissions.create({
        fileId,
        requestBody: { role: "reader", type: "anyone" },
      })
    }

    const file = await this.drive.files.get({
      fileId,
      fields: "webViewLink",
    })

    return file.data.webViewLink ?? `https://drive.google.com/file/d/${fileId}/view`
  }

  private async findFileId(id: string): Promise<string> {
    const folderId = await this.getOrCreateFolder()

    const res = await this.drive.files.list({
      q: `'${folderId}' in parents and name='${id}.json' and trashed=false`,
      fields: "files(id)",
    })

    if (!res.data.files?.length) {
      throw new Error(`Decision ${id} not found`)
    }

    return res.data.files[0].id!
  }
}
