import { z } from 'zod'

// Request schema for query API
export const QueryRequestSchema = z.object({
  query: z.string().min(3).max(1000),
})

// Source citation schema (from retrieved chunks)
export const QuerySourceSchema = z.object({
  text: z.string(),
  pageNumber: z.number(),
  section: z.string(),
  subsection: z.string(),
  score: z.number(),
})

// Response schema (for non-streaming metadata)
export const QueryResponseSchema = z.object({
  answer: z.string(),
  sources: z.array(QuerySourceSchema),
  cached: z.boolean(),
})

// Inferred TypeScript types
export type QueryRequest = z.infer<typeof QueryRequestSchema>
export type QuerySource = z.infer<typeof QuerySourceSchema>
export type QueryResponse = z.infer<typeof QueryResponseSchema>
