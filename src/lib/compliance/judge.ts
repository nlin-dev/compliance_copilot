import { z } from 'zod'
import {
  LengthFinishReasonError,
  ContentFilterFinishReasonError,
} from 'openai/core/error'
import { zodResponseFormat } from 'openai/helpers/zod'
import { openai } from '../openai'
import {
  ComplianceCategory,
  ComplianceFinding,
} from '@/schemas/compliance'
import { Source } from '@/schemas/common'
import { RetrievalResult } from '../retrieval/retrieve'
import { CategoryEvidence } from './extract'

/**
 * Schema for LLM judgment response.
 * Matches ComplianceFindingSchema structure (minus category and sources which are added after).
 */
const JudgmentSchema = z.object({
  status: z.enum(['PASS', 'FAIL', 'NEEDS_REVIEW']).describe(
    'PASS: Clear evidence satisfies requirement. FAIL: Evidence contradicts or requirement not met. NEEDS_REVIEW: Insufficient information or ambiguous.'
  ),
  requirement: z.string().describe('The specific CMS requirement being checked'),
  evidence: z.string().optional().describe('Quote from the note supporting the finding'),
  explanation: z.string().describe('Why this finding passed, failed, or needs review'),
})

type _Judgment = z.infer<typeof JudgmentSchema>

/**
 * System prompt for compliance judgment.
 */
const SYSTEM_PROMPT = `You are a CMS Medicare home health compliance expert.

Your task is to judge whether extracted evidence from a visit note satisfies CMS compliance requirements.

Judgment criteria:
- PASS: Clear evidence in the note satisfies the CMS requirement
- FAIL: Evidence contradicts the requirement, or the requirement is clearly not met
- NEEDS_REVIEW: Insufficient information to make a determination, or evidence is ambiguous

Guidelines:
1. Be conservative - when uncertain, use NEEDS_REVIEW
2. Always cite the specific CMS requirement you are checking
3. Quote relevant evidence from the note when available
4. Provide clear explanations for your judgment
5. Consider both explicit statements and reasonable inferences from the evidence`

/**
 * Options for judging compliance on a single category.
 */
export interface JudgeComplianceOptions {
  category: ComplianceCategory
  claims: CategoryEvidence
  requirements: RetrievalResult[]
}

/**
 * Judges compliance for a single category given extracted claims and retrieved requirements.
 *
 * @param options - Category, extracted claims, and retrieved CMS requirements
 * @returns ComplianceFinding with sources populated from requirements
 */
export async function judgeCompliance(
  options: JudgeComplianceOptions
): Promise<ComplianceFinding> {
  const { category, claims, requirements } = options

  // Build user prompt with claims and requirements
  const requirementsText = requirements
    .map((r, i) => `[Requirement ${i + 1}] (Page ${r.pageNumber}, ${r.section})\n${r.text}`)
    .join('\n\n')

  const evidenceText = claims.present
    ? `Evidence found:\n${claims.evidence.map((e, i) => `${i + 1}. ${e}`).join('\n')}`
    : 'No relevant evidence was found in the visit note.'

  const userPrompt = `Judge compliance for category: ${category}

${evidenceText}

CMS Requirements to check against:
${requirementsText}

Provide your judgment with:
1. The specific CMS requirement you are checking
2. Your status (PASS, FAIL, or NEEDS_REVIEW)
3. Evidence from the note (if available)
4. Clear explanation for your judgment`

  try {
    const response = await openai.chat.completions.parse({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: zodResponseFormat(JudgmentSchema, 'judgment'),
    })

    const parsed = response.choices[0].message.parsed

    if (!parsed) {
      throw new Error('Failed to parse structured response from OpenAI')
    }

    // Build sources from requirements
    const sources: Source[] = requirements.map((r, i) => ({
      id: `req-${category}-${i}`,
      content: r.text,
      metadata: {
        page: r.pageNumber,
        section: r.section,
        subsection: r.subsection,
      },
      score: r.score,
    }))

    // Construct ComplianceFinding
    const finding: ComplianceFinding = {
      category,
      status: parsed.status,
      requirement: parsed.requirement,
      evidence: parsed.evidence,
      explanation: parsed.explanation,
      sources,
    }

    return finding
  } catch (error) {
    // Handle length finish reason - return NEEDS_REVIEW finding
    if (error instanceof LengthFinishReasonError) {
      const sources: Source[] = requirements.map((r, i) => ({
        id: `req-${category}-${i}`,
        content: r.text,
        metadata: {
          page: r.pageNumber,
          section: r.section,
          subsection: r.subsection,
        },
        score: r.score,
      }))

      return {
        category,
        status: 'NEEDS_REVIEW',
        requirement: 'Unable to determine specific requirement due to response truncation',
        evidence: undefined,
        explanation: 'Response was truncated. Manual review required.',
        sources,
      }
    }

    // Handle content filter - throw descriptive error
    if (error instanceof ContentFilterFinishReasonError) {
      throw new Error(
        `Content was filtered by OpenAI safety systems for category ${category}. Please review the content for potentially problematic material.`
      )
    }

    // Re-throw other errors
    throw error
  }
}
