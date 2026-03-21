import { auth } from "@/auth"
import { getStorageAdapter } from "@/lib/storage"
import { notFound } from "next/navigation"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { StatusBadge } from "@/components/status-badge"
import { ShareButton } from "@/components/share-button"
import { formatDate } from "@/lib/utils"
import { Edit, ArrowLeft } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function DecisionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session) return null

  let decision
  try {
    const adapter = getStorageAdapter(session)
    decision = await adapter.get(id)
  } catch {
    notFound()
  }

  const chosenOption = decision.options.find((o) => o.chosen)

  return (
    <div className="space-y-8">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/decisions"
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Decisions
        </Link>
        <div className="flex items-center gap-2">
          <ShareButton id={id} />
          <Link
            href={`/decisions/${id}/edit`}
            className="flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            <Edit className="h-3.5 w-3.5" />
            Edit
          </Link>
        </div>
      </div>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <StatusBadge status={decision.status} />
          {decision.supersededBy && (
            <Link
              href={`/decisions/${decision.supersededBy}`}
              className="text-xs text-violet-600 hover:underline"
            >
              Superseded by →
            </Link>
          )}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          {decision.title}
        </h1>
        <div className="flex flex-wrap gap-4 text-sm text-zinc-500">
          <span>{formatDate(decision.date)}</span>
          {decision.deciders.length > 0 && (
            <span>Decided by: {decision.deciders.join(", ")}</span>
          )}
          {decision.tags.length > 0 && (
            <div className="flex gap-1.5">
              {decision.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <hr className="border-zinc-100" />

      {/* ADR sections */}
      <Section title="Context" content={decision.context} />
      <Section title="Decision" content={decision.decision} />
      <Section title="Consequences" content={decision.consequences} />

      {/* Options */}
      {decision.options.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-zinc-900">
            Options considered
          </h2>

          {chosenOption && (
            <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-green-700">
                Chosen option
              </p>
              <p className="mt-1 font-medium text-green-900">
                {chosenOption.title}
              </p>
              {chosenOption.description && (
                <p className="mt-1 text-sm text-green-800">
                  {chosenOption.description}
                </p>
              )}
            </div>
          )}

          <div className="space-y-3">
            {decision.options.map((option) => (
              <div
                key={option.id}
                className={`rounded-md border px-4 py-3 ${
                  option.chosen
                    ? "border-green-200 bg-white"
                    : "border-zinc-200 bg-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      option.chosen ? "bg-green-500" : "bg-zinc-200"
                    }`}
                  />
                  <span className="font-medium text-zinc-900">
                    {option.title}
                  </span>
                </div>
                {option.description && (
                  <p className="mt-1.5 text-sm text-zinc-600">
                    {option.description}
                  </p>
                )}
                {(option.pros.length > 0 || option.cons.length > 0) && (
                  <div className="mt-2.5 grid grid-cols-2 gap-4">
                    {option.pros.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-green-700">
                          Pros
                        </p>
                        <ul className="mt-1 space-y-0.5">
                          {option.pros.map((p, i) => (
                            <li
                              key={i}
                              className="flex gap-1.5 text-xs text-zinc-600"
                            >
                              <span className="text-green-500 shrink-0">+</span>
                              {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {option.cons.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-red-700">
                          Cons
                        </p>
                        <ul className="mt-1 space-y-0.5">
                          {option.cons.map((c, i) => (
                            <li
                              key={i}
                              className="flex gap-1.5 text-xs text-zinc-600"
                            >
                              <span className="text-red-400 shrink-0">−</span>
                              {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata footer */}
      <div className="border-t border-zinc-100 pt-4 text-xs text-zinc-400 space-y-1">
        <p>Created by {decision.createdBy}</p>
        <p>
          Last updated {new Date(decision.updatedAt).toLocaleString()}
        </p>
        <p className="font-mono">{decision.id}</p>
      </div>
    </div>
  )
}

function Section({
  title,
  content,
}: {
  title: string
  content: string
}) {
  if (!content) return null
  return (
    <div className="space-y-2">
      <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
      <div className="prose prose-sm max-w-none text-zinc-700">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </div>
  )
}
