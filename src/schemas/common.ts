import { z } from 'zod'

// Common error response
export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  details: z.record(z.string(), z.string()).optional(),
})

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>

// Source citation from vector retrieval
export const SourceSchema = z.object({
  id: z.string(),
  content: z.string(),
  metadata: z.object({
    page: z.number().optional(),
    section: z.string().optional(),
    subsection: z.string().optional(),
  }),
  score: z.number(),
})

export type Source = z.infer<typeof SourceSchema>
