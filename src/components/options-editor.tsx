"use client"

import { nanoid } from "nanoid"
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import type { Option } from "@/lib/decisions/schema"

interface OptionsEditorProps {
  options: Option[]
  onChange: (options: Option[]) => void
}

export function OptionsEditor({ options, onChange }: OptionsEditorProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(
    options.length > 0 ? 0 : null,
  )

  const add = () => {
    const next = [
      ...options,
      {
        id: nanoid(),
        title: "",
        description: "",
        pros: [],
        cons: [],
        chosen: false,
      },
    ]
    onChange(next)
    setOpenIndex(next.length - 1)
  }

  const remove = (index: number) => {
    onChange(options.filter((_, i) => i !== index))
    setOpenIndex(null)
  }

  const update = (index: number, patch: Partial<Option>) => {
    const next = [...options]
    next[index] = { ...next[index], ...patch }
    onChange(next)
  }

  const setChosen = (index: number) => {
    onChange(
      options.map((o, i) => ({ ...o, chosen: i === index ? !o.chosen : false })),
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-700">
          Options considered
        </span>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add option
        </button>
      </div>

      {options.length === 0 && (
        <p className="rounded-md border border-dashed border-zinc-200 px-3 py-4 text-center text-xs text-zinc-400">
          No options yet. Add the alternatives you considered.
        </p>
      )}

      {options.map((option, i) => (
        <div
          key={option.id}
          className={cn(
            "rounded-md border bg-white",
            option.chosen ? "border-green-300" : "border-zinc-200",
          )}
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-3 py-2">
            <button
              type="button"
              onClick={() => setChosen(i)}
              title="Mark as chosen option"
              className={cn(
                "h-4 w-4 shrink-0 rounded-full border-2 transition-colors",
                option.chosen
                  ? "border-green-500 bg-green-500"
                  : "border-zinc-300 hover:border-zinc-500",
              )}
            />
            <input
              type="text"
              value={option.title}
              onChange={(e) => update(i, { title: e.target.value })}
              placeholder="Option title"
              className="flex-1 bg-transparent text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={() =>
                setOpenIndex(openIndex === i ? null : i)
              }
              className="text-zinc-400 hover:text-zinc-700"
            >
              {openIndex === i ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-zinc-300 hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {/* Expanded */}
          {openIndex === i && (
            <div className="space-y-3 border-t border-zinc-100 px-3 pb-3 pt-2">
              <textarea
                value={option.description}
                onChange={(e) => update(i, { description: e.target.value })}
                placeholder="Brief description of this option…"
                rows={2}
                className="w-full rounded border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-sm font-mono text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-300 resize-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <ListEditor
                  label="Pros"
                  items={option.pros}
                  onChange={(pros) => update(i, { pros })}
                  placeholder="Add pro…"
                  accent="green"
                />
                <ListEditor
                  label="Cons"
                  items={option.cons}
                  onChange={(cons) => update(i, { cons })}
                  placeholder="Add con…"
                  accent="red"
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function ListEditor({
  label,
  items,
  onChange,
  placeholder,
  accent,
}: {
  label: string
  items: string[]
  onChange: (items: string[]) => void
  placeholder: string
  accent: "green" | "red"
}) {
  const [input, setInput] = useState("")

  const add = () => {
    const val = input.trim()
    if (val) {
      onChange([...items, val])
      setInput("")
    }
  }

  return (
    <div className="space-y-1">
      <p
        className={cn(
          "text-xs font-medium",
          accent === "green" ? "text-green-700" : "text-red-700",
        )}
      >
        {label}
      </p>
      <ul className="space-y-0.5">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex items-start gap-1 text-xs text-zinc-700"
          >
            <span
              className={cn(
                "mt-0.5 shrink-0 text-xs",
                accent === "green" ? "text-green-500" : "text-red-400",
              )}
            >
              {accent === "green" ? "+" : "−"}
            </span>
            <span className="flex-1">{item}</span>
            <button
              type="button"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="text-zinc-300 hover:text-zinc-600"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-1">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder={placeholder}
          className="flex-1 rounded border border-zinc-200 bg-white px-2 py-0.5 text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-300"
        />
        <button
          type="button"
          onClick={add}
          className="rounded border border-zinc-200 px-2 text-xs text-zinc-500 hover:border-zinc-400 hover:text-zinc-800"
        >
          +
        </button>
      </div>
    </div>
  )
}
