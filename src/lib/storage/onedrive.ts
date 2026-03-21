import { Client } from "@microsoft/microsoft-graph-client"
import type { StorageAdapter } from "./types"
import type { Decision, DecisionMeta } from "@/lib/decisions/schema"
import { toMeta } from "@/lib/decisions/schema"

const FOLDER_NAME = "Observable Decisions"
const FOLDER_PATH = `/me/drive/root:/${FOLDER_NAME}`

export class OneDriveAdapter implements StorageAdapter {
  private client: Client

  constructor(accessToken: string) {
    this.client = Client.init({
      authProvider: (done) => done(null, accessToken),
    })
  }

  private async ensureFolder(): Promise<void> {
    try {
      await this.client.api(FOLDER_PATH).get()
    } catch {
      await this.client.api("/me/drive/root/children").post({
        name: FOLDER_NAME,
        folder: {},
        "@microsoft.graph.conflictBehavior": "fail",
      })
    }
  }

  async list(): Promise<DecisionMeta[]> {
    await this.ensureFolder()

    const res = await this.client
      .api(`${FOLDER_PATH}:/children`)
      .filter("file ne null")
      .get()

    const items: DecisionMeta[] = []
    for (const item of res.value ?? []) {
      if (!item.name?.endsWith(".json")) continue
      try {
        const content = await this.client
          .api(`/me/drive/items/${item.id}/content`)
          .get()
        const decision: Decision = JSON.parse(
          typeof content === "string" ? content : JSON.stringify(content),
        )
        items.push(toMeta(decision))
      } catch {
        // skip malformed files
      }
    }

    return items.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
  }

  async get(id: string): Promise<Decision> {
    await this.ensureFolder()
    const content = await this.client
      .api(`${FOLDER_PATH}:/${id}.json:/content`)
      .get()
    return JSON.parse(
      typeof content === "string" ? content : JSON.stringify(content),
    )
  }

  async put(id: string, data: Decision): Promise<void> {
    await this.ensureFolder()
    const body = JSON.stringify(data, null, 2)
    await this.client
      .api(`${FOLDER_PATH}:/${id}.json:/content`)
      .put(body)
  }

  async delete(id: string): Promise<void> {
    await this.ensureFolder()
    try {
      await this.client.api(`${FOLDER_PATH}:/${id}.json`).delete()
    } catch {
      // file may not exist
    }
  }

  async share(id: string, email?: string): Promise<string> {
    await this.ensureFolder()
    const item = await this.client
      .api(`${FOLDER_PATH}:/${id}.json`)
      .get()

    const body: Record<string, unknown> = {
      type: "view",
      scope: email ? "users" : "anonymous",
    }
    if (email) {
      body.recipients = [{ email }]
    }

    const res = await this.client
      .api(`/me/drive/items/${item.id}/createLink`)
      .post(body)

    return res.link?.webUrl ?? ""
  }
}
