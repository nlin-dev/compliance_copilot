import { z } from 'zod'
import { SourceSchema } from './common'

// Query request validation
export const QueryRequestSchema = z.object({
  question: z
    .string()
    .min(3, 'Question must be at least 3 characters')
    .max(1000, 'Question must be less than 1000 characters')
    .trim(),
  filters: z
    .object({
      section: z.string().optional(),
      page: z.number().int().positive().optional(),
    })
    .optional(),
})

export type QueryRequest = z.infer<typeof QueryRequestSchema>

// Query response
export const QueryResponseSchema = z.object({
  answer: z.string(),
  sources: z.array(SourceSchema),
  cached: z.boolean(),
  processingTime: z.number(), // milliseconds
})

export type QueryResponse = z.infer<typeof QueryResponseSchema>
