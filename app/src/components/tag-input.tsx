import { useState, KeyboardEvent } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  className?: string
}

export function TagInput({
  value,
  onChange,
  placeholder = "Add tag…",
  className,
}: TagInputProps) {
  const [input, setInput] = useState("")

  const add = (raw: string) => {
    const tag = raw.trim().toLowerCase()
    if (tag && !value.includes(tag)) {
      onChange([...value, tag])
    }
    setInput("")
  }

  const remove = (tag: string) => {
    onChange(value.filter((t) => t !== tag))
  }

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      add(input)
    } else if (e.key === "Backspace" && !input && value.length > 0) {
      remove(value[value.length - 1])
    }
  }

  return (
    <div
      className={cn(
        "flex min-h-[44px] flex-wrap gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-2 focus-within:ring-1 focus-within:ring-zinc-400 sm:min-h-0",
        className,
      )}
    >
      {value.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-700"
        >
          {tag}
          <button
            type="button"
            onClick={() => remove(tag)}
            className="-mr-0.5 p-1 text-zinc-400 hover:text-zinc-700"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKey}
        onBlur={() => input && add(input)}
        placeholder={value.length === 0 ? placeholder : ""}
        className="min-w-[100px] flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400"
      />
    </div>
  )
}
