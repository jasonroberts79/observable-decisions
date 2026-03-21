"use client"

import { useState, FormEvent } from "react"
import { useRouter } from "next/navigation"
import { TagInput } from "@/components/tag-input"
import { MarkdownField } from "@/components/markdown-field"
import { OptionsEditor } from "@/components/options-editor"
import { todayISO } from "@/lib/utils"
import { DecisionStatus, STATUS_LABELS } from "@/lib/decisions/schema"
import type { Decision, Option } from "@/lib/decisions/schema"

type FormMode = "create" | "edit"

interface DecisionFormProps {
  mode: FormMode
  initial?: Partial<Decision>
}

export function DecisionForm({ mode, initial }: DecisionFormProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState(initial?.title ?? "")
  const [status, setStatus] = useState<DecisionStatus>(
    initial?.status ?? "proposed",
  )
  const [date, setDate] = useState(initial?.date ?? todayISO())
  const [deciders, setDeciders] = useState<string[]>(initial?.deciders ?? [])
  const [tags, setTags] = useState<string[]>(initial?.tags ?? [])
  const [context, setContext] = useState(initial?.context ?? "")
  const [decision, setDecision] = useState(initial?.decision ?? "")
  const [consequences, setConsequences] = useState(
    initial?.consequences ?? "",
  )
  const [options, setOptions] = useState<Option[]>(initial?.options ?? [])
  const [supersededBy, setSupersededBy] = useState(
    initial?.supersededBy ?? "",
  )

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const body = {
      title,
      status,
      date,
      deciders,
      tags,
      context,
      decision,
      consequences,
      options,
      supersededBy: supersededBy || undefined,
    }

    try {
      const url =
        mode === "edit" && initial?.id
          ? `/api/decisions/${initial.id}`
          : "/api/decisions"
      const method = mode === "edit" ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Request failed")
      }

      const saved: Decision = await res.json()
      router.push(`/decisions/${saved.id}`)
      router.refresh()
    } catch (err) {
      setError(String(err))
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Title */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-zinc-700">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Short imperative sentence describing the decision…"
          className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
        />
      </div>

      {/* Row: status, date */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as DecisionStatus)}
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          >
            {DecisionStatus.options.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </div>
      </div>

      {/* Deciders */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-zinc-700">Deciders</label>
        <TagInput
          value={deciders}
          onChange={setDeciders}
          placeholder="Add name or email…"
        />
        <p className="text-xs text-zinc-400">
          Press Enter or comma to add each person.
        </p>
      </div>

      {/* Tags */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-zinc-700">Tags</label>
        <TagInput value={tags} onChange={setTags} placeholder="Add tag…" />
      </div>

      <hr className="border-zinc-100" />

      {/* Markdown fields */}
      <MarkdownField
        label="Context"
        value={context}
        onChange={setContext}
        placeholder="What is the issue motivating this decision? What is the context in which it was made?"
        minRows={5}
      />

      <MarkdownField
        label="Decision"
        value={decision}
        onChange={setDecision}
        placeholder="What is the change that we're proposing or have agreed to implement?"
        minRows={4}
        required
      />

      <MarkdownField
        label="Consequences"
        value={consequences}
        onChange={setConsequences}
        placeholder="What becomes easier or more difficult as a result of this decision?"
        minRows={4}
      />

      <hr className="border-zinc-100" />

      <OptionsEditor options={options} onChange={setOptions} />

      {/* Superseded by */}
      {(status === "superseded" || initial?.supersededBy) && (
        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700">
            Superseded by (decision ID)
          </label>
          <input
            type="text"
            value={supersededBy}
            onChange={(e) => setSupersededBy(e.target.value)}
            placeholder="ID of the superseding decision"
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-zinc-100 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors"
        >
          {submitting
            ? "Saving…"
            : mode === "edit"
              ? "Save changes"
              : "Create decision"}
        </button>
      </div>
    </form>
  )
}
