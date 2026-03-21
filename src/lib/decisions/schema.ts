import { z } from "zod"

export const OptionSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string().default(""),
  pros: z.array(z.string()).default([]),
  cons: z.array(z.string()).default([]),
  chosen: z.boolean().default(false),
})

export const DecisionStatus = z.enum([
  "proposed",
  "accepted",
  "rejected",
  "deprecated",
  "superseded",
])

export const DecisionSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  status: DecisionStatus.default("proposed"),
  date: z.string(), // YYYY-MM-DD
  deciders: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  context: z.string().default(""),
  decision: z.string().default(""),
  consequences: z.string().default(""),
  options: z.array(OptionSchema).default([]),
  supersededBy: z.string().optional(),
  shareToken: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: z.string(),
  sharedWith: z.array(z.string()).default([]),
})

export type Option = z.infer<typeof OptionSchema>
export type Decision = z.infer<typeof DecisionSchema>
export type DecisionStatus = z.infer<typeof DecisionStatus>

export type DecisionMeta = Pick<
  Decision,
  "id" | "title" | "status" | "date" | "tags" | "deciders" | "updatedAt" | "createdBy"
>

export function toMeta(d: Decision): DecisionMeta {
  return {
    id: d.id,
    title: d.title,
    status: d.status,
    date: d.date,
    tags: d.tags,
    deciders: d.deciders,
    updatedAt: d.updatedAt,
    createdBy: d.createdBy,
  }
}

export const STATUS_LABELS: Record<DecisionStatus, string> = {
  proposed: "Proposed",
  accepted: "Accepted",
  rejected: "Rejected",
  deprecated: "Deprecated",
  superseded: "Superseded",
}
