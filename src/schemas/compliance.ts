import { z } from 'zod'
import { SourceSchema } from './common'

// Compliance categories
export const ComplianceCategorySchema = z.enum([
  'homebound_status',
  'skilled_nursing_need',
  'plan_of_care',
  'face_to_face',
  'documentation',
])

export type ComplianceCategory = z.infer<typeof ComplianceCategorySchema>

// Individual compliance finding
export const ComplianceFindingSchema = z.object({
  category: ComplianceCategorySchema,
  status: z.enum(['PASS', 'FAIL', 'NEEDS_REVIEW']),
  requirement: z.string(), // The CMS requirement being checked
  evidence: z.string().optional(), // Quote from the note that supports the finding
  explanation: z.string(), // Why it passed/failed/needs review
  sources: z.array(SourceSchema), // CMS references
})

export type ComplianceFinding = z.infer<typeof ComplianceFindingSchema>

// Compliance request validation
export const ComplianceRequestSchema = z.object({
  visitNote: z
    .string()
    .min(50, 'Visit note must be at least 50 characters')
    .max(10000, 'Visit note must be less than 10,000 characters')
    .trim(),
  categories: z
    .array(ComplianceCategorySchema)
    .optional()
    .default([
      'homebound_status',
      'skilled_nursing_need',
      'plan_of_care',
      'face_to_face',
      'documentation',
    ]),
})

export type ComplianceRequest = z.infer<typeof ComplianceRequestSchema>

// Compliance response
export const ComplianceResponseSchema = z.object({
  overallStatus: z.enum(['PASS', 'FAIL', 'NEEDS_REVIEW']),
  findings: z.array(ComplianceFindingSchema),
  summary: z.string(),
  processingTime: z.number(), // milliseconds
})

export type ComplianceResponse = z.infer<typeof ComplianceResponseSchema>
