import { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"

interface MarkdownFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minRows?: number
  required?: boolean
}

export function MarkdownField({
  label,
  value,
  onChange,
  placeholder,
  minRows = 5,
  required,
}: MarkdownFieldProps) {
  const [preview, setPreview] = useState(false)

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-zinc-700">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
        <div className="flex rounded border border-zinc-200 text-xs">
          <button
            type="button"
            onClick={() => setPreview(false)}
            className={cn(
              "px-2 py-0.5 transition-colors",
              !preview
                ? "bg-zinc-900 text-white"
                : "text-zinc-500 hover:text-zinc-700",
            )}
          >
            Write
          </button>
          <button
            type="button"
            onClick={() => setPreview(true)}
            className={cn(
              "px-2 py-0.5 transition-colors",
              preview
                ? "bg-zinc-900 text-white"
                : "text-zinc-500 hover:text-zinc-700",
            )}
          >
            Preview
          </button>
        </div>
      </div>

      {preview ? (
        <div
          className="prose prose-sm max-w-none min-h-[120px] rounded-md border border-zinc-200 bg-white px-3 py-2"
          style={{
            minHeight: `${minRows * 1.5 + 1}rem`,
          }}
        >
          {value ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
          ) : (
            <p className="text-zinc-400 text-sm italic">Nothing to preview.</p>
          )}
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          rows={minRows}
          className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 resize-y"
        />
      )}
    </div>
  )
}
