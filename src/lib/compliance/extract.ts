import { z } from 'zod'
import {
  LengthFinishReasonError,
  ContentFilterFinishReasonError,
} from 'openai/core/error'
import { zodResponseFormat } from 'openai/helpers/zod'
import { openai } from '../openai'
import {
  ComplianceCategory,
  ComplianceCategorySchema,
} from '@/schemas/compliance'

/**
 * Evidence extracted for a single compliance category.
 */
const CategoryEvidenceSchema = z.object({
  category: ComplianceCategorySchema.describe('The compliance category this evidence relates to'),
  present: z.boolean().describe('Whether evidence for this category was found in the note'),
  evidence: z.array(z.string()).describe('Relevant quotes or paraphrased evidence from the note'),
})

/**
 * Schema for extracted claims across all requested categories.
 * Uses array format for OpenAI structured output compatibility.
 */
const ExtractedClaimsArraySchema = z.object({
  claims: z.array(CategoryEvidenceSchema).describe('Evidence found for each compliance category'),
})

/**
 * Internal representation with record structure for easier lookup.
 */
export type ExtractedClaims = {
  claims: Record<ComplianceCategory, CategoryEvidence>
}
export type CategoryEvidence = { present: boolean; evidence: string[] }

/**
 * System prompt for claims extraction.
 */
const SYSTEM_PROMPT = `You are an expert at identifying compliance-relevant claims in home health visit notes.

Your task is to extract evidence from visit notes that relates to CMS Medicare home health compliance categories.

For each requested category, determine:
1. Whether relevant evidence is PRESENT in the note
2. Extract specific quotes or paraphrased evidence from the note

Category definitions:
- homebound_status: Evidence about patient's ability to leave home, difficulty of leaving, medical necessity for home care
- skilled_nursing_need: Evidence of skilled nursing services, procedures requiring trained nurses, clinical assessments
- plan_of_care: References to care plans, physician orders, treatment goals, interventions planned
- face_to_face: Documentation of physician/NP encounters, face-to-face visit requirements
- documentation: General documentation quality - signatures, dates, visit timing, required fields

Be thorough but accurate. Only mark evidence as present if the note actually contains relevant information.
Extract verbatim quotes when possible, or provide accurate paraphrases.`

/**
 * Extracts compliance-relevant claims from a visit note using OpenAI structured output.
 *
 * @param visitNote - The visit note text to analyze
 * @param categories - Compliance categories to extract evidence for
 * @returns Extracted claims per category, or partial results with warning on truncation
 */
export async function extractClaims(
  visitNote: string,
  categories: ComplianceCategory[]
): Promise<{ claims: ExtractedClaims; warning?: string }> {
  const userPrompt = `Extract compliance-relevant evidence from this visit note for the following categories: ${categories.join(', ')}

Visit Note:
${visitNote}

For each category, indicate whether evidence is present and list the specific evidence found.`

  try {
    const response = await openai.chat.completions.parse({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: zodResponseFormat(ExtractedClaimsArraySchema, 'extracted_claims'),
    })

    const parsed = response.choices[0].message.parsed

    if (!parsed) {
      throw new Error('Failed to parse structured response from OpenAI')
    }

    // Convert array format to record format for easier lookup
    const claimsRecord: Record<ComplianceCategory, CategoryEvidence> = {} as Record<ComplianceCategory, CategoryEvidence>
    for (const claim of parsed.claims) {
      claimsRecord[claim.category] = {
        present: claim.present,
        evidence: claim.evidence,
      }
    }

    return { claims: { claims: claimsRecord } }
  } catch (error) {
    // Handle length finish reason - return partial with warning
    if (error instanceof LengthFinishReasonError) {
      const partialClaims: ExtractedClaims = {
        claims: {} as Record<ComplianceCategory, CategoryEvidence>,
      }

      // Initialize all categories as not present
      for (const category of categories) {
        partialClaims.claims[category] = { present: false, evidence: [] }
      }

      return {
        claims: partialClaims,
        warning: 'Response was truncated due to length. Results may be incomplete.',
      }
    }

    // Handle content filter - throw descriptive error
    if (error instanceof ContentFilterFinishReasonError) {
      throw new Error(
        'Content was filtered by OpenAI safety systems. Please review the visit note for potentially problematic content.'
      )
    }

    // Re-throw other errors
    throw error
  }
}
