import { useState } from "react"
import { Share2, Check, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { shareDecision } from "@/lib/api"

interface ShareButtonProps {
  id: string
}

export function ShareButton({ id }: ShareButtonProps) {
  const { user } = useAuth()
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  )
  const [email, setEmail] = useState("")
  const [open, setOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState("")

  const share = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setState("loading")
    try {
      const data = await shareDecision(
        id,
        user.userDetails,
        email || undefined,
      )
      setShareUrl(data.url)
      setState("done")
    } catch {
      setState("error")
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
      >
        <Share2 className="h-3.5 w-3.5" />
        Share
      </button>
    )
  }

  return (
    <div className="relative">
      <div className="absolute right-0 top-9 z-20 w-72 rounded-md border border-zinc-200 bg-white p-3 shadow-lg">
        {state === "done" ? (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-sm font-medium text-green-700">
              <Check className="h-4 w-4" />
              Share link ready
            </div>
            <input
              readOnly
              value={shareUrl}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              className="w-full rounded border border-zinc-200 bg-zinc-50 px-2 py-1 font-mono text-xs text-zinc-700"
            />
            <p className="text-xs text-zinc-400">Click to select, then copy.</p>
          </div>
        ) : (
          <form onSubmit={share} className="space-y-2">
            <p className="text-sm font-medium text-zinc-800">Share decision</p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address (optional)"
              className="w-full rounded border border-zinc-200 px-2.5 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
            <p className="text-xs text-zinc-400">
              Leave blank to generate a public link.
            </p>
            {state === "error" && (
              <p className="text-xs text-red-600">
                Failed to generate share link.
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={state === "loading"}
                className="flex items-center gap-1 rounded bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
              >
                {state === "loading" && (
                  <Loader2 className="h-3 w-3 animate-spin" />
                )}
                Get link
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xs text-zinc-500 hover:text-zinc-800"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
      <button
        onClick={() => setOpen(false)}
        className="flex items-center gap-1.5 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm text-zinc-700"
      >
        <Share2 className="h-3.5 w-3.5" />
        Share
      </button>
    </div>
  )
}
