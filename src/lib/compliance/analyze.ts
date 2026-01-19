import {
  ComplianceCategory,
  ComplianceFinding,
  ComplianceResponse,
} from '@/schemas/compliance'
import { extractClaims } from './extract'
import { judgeCompliance } from './judge'
import { embedQuery } from '../retrieval/embed'
import { retrieveChunks } from '../retrieval/retrieve'

/**
 * Critical categories that cause overall FAIL when not met.
 */
const CRITICAL_CATEGORIES: ComplianceCategory[] = [
  'homebound_status',
  'skilled_nursing_need',
  'plan_of_care',
]

/**
 * Category-specific queries for retrieval.
 */
const CATEGORY_QUERIES: Record<ComplianceCategory, string> = {
  homebound_status: 'Medicare home health homebound status requirements criteria',
  skilled_nursing_need: 'Medicare skilled nursing services medical necessity requirements',
  plan_of_care: 'Medicare home health plan of care documentation requirements',
  face_to_face: 'Medicare home health face-to-face encounter requirements',
  documentation: 'Medicare home health visit documentation requirements',
}

/**
 * Result of aggregating findings including overall status and summary.
 */
export interface AggregatedResult {
  overallStatus: 'PASS' | 'FAIL' | 'NEEDS_REVIEW'
  summary: string
}

/**
 * Aggregates compliance findings into an overall status and summary.
 *
 * Overall status logic:
 * - Any FAIL on critical category (homebound_status, skilled_nursing_need, plan_of_care) → FAIL
 * - Any FAIL on non-critical category → NEEDS_REVIEW
 * - Any NEEDS_REVIEW → NEEDS_REVIEW
 * - All PASS → PASS
 */
export function aggregateFindings(findings: ComplianceFinding[]): AggregatedResult {
  const failedCritical = findings.filter(
    (f) => f.status === 'FAIL' && CRITICAL_CATEGORIES.includes(f.category)
  )
  const failedNonCritical = findings.filter(
    (f) => f.status === 'FAIL' && !CRITICAL_CATEGORIES.includes(f.category)
  )
  const needsReview = findings.filter((f) => f.status === 'NEEDS_REVIEW')
  const passed = findings.filter((f) => f.status === 'PASS')

  // Determine overall status
  let overallStatus: 'PASS' | 'FAIL' | 'NEEDS_REVIEW'

  if (failedCritical.length > 0) {
    overallStatus = 'FAIL'
  } else if (failedNonCritical.length > 0 || needsReview.length > 0) {
    overallStatus = 'NEEDS_REVIEW'
  } else {
    overallStatus = 'PASS'
  }

  // Generate summary
  const summary = generateSummary({
    overallStatus,
    failedCritical,
    failedNonCritical,
    needsReview,
    passed,
    total: findings.length,
  })

  return { overallStatus, summary }
}

interface SummaryParams {
  overallStatus: 'PASS' | 'FAIL' | 'NEEDS_REVIEW'
  failedCritical: ComplianceFinding[]
  failedNonCritical: ComplianceFinding[]
  needsReview: ComplianceFinding[]
  passed: ComplianceFinding[]
  total: number
}

function generateSummary(params: SummaryParams): string {
  const { overallStatus, failedCritical, failedNonCritical, needsReview, passed, total } = params

  if (overallStatus === 'PASS') {
    return `All ${total} compliance categories passed. The visit note meets CMS home health requirements.`
  }

  if (overallStatus === 'FAIL') {
    const criticalCategories = failedCritical.map((f) => f.category).join(', ')
    return `Critical compliance failure detected in: ${criticalCategories}. The visit note does not meet CMS home health requirements. ${passed.length}/${total} categories passed.`
  }

  // NEEDS_REVIEW
  const issues: string[] = []
  if (failedNonCritical.length > 0) {
    issues.push(`non-critical failures in ${failedNonCritical.map((f) => f.category).join(', ')}`)
  }
  if (needsReview.length > 0) {
    issues.push(`${needsReview.length} categories require manual review`)
  }

  return `Compliance review needed: ${issues.join('; ')}. ${passed.length}/${total} categories passed.`
}

/**
 * Analyzes a visit note for CMS compliance across specified categories.
 *
 * Orchestration flow:
 * 1. Extract claims from visit note
 * 2. For each category in parallel:
 *    a. Build category-specific query
 *    b. Embed the query
 *    c. Retrieve relevant CMS requirements
 *    d. Judge compliance
 * 3. Aggregate findings
 *
 * @param visitNote - The visit note text to analyze
 * @param categories - Compliance categories to check
 * @returns ComplianceResponse with findings and overall status
 */
export async function analyzeCompliance(
  visitNote: string,
  categories: ComplianceCategory[]
): Promise<ComplianceResponse> {
  const startTime = Date.now()

  // Step 1: Extract claims from visit note
  const { claims } = await extractClaims(visitNote, categories)

  // Step 2: Process each category in parallel
  const findings = await Promise.all(
    categories.map(async (category): Promise<ComplianceFinding> => {
      // Build category-specific query
      const query = CATEGORY_QUERIES[category]

      // Embed the query
      const embedding = await embedQuery(query)

      // Retrieve relevant requirements (topK=3 as specified)
      const requirements = await retrieveChunks(embedding, 3)

      // Get claims for this category
      const categoryEvidence = claims.claims[category] || { present: false, evidence: [] }

      // Judge compliance
      const finding = await judgeCompliance({
        category,
        claims: categoryEvidence,
        requirements,
      })

      return finding
    })
  )

  // Step 3: Aggregate findings
  const { overallStatus, summary } = aggregateFindings(findings)

  const processingTime = Date.now() - startTime

  return {
    overallStatus,
    findings,
    summary,
    processingTime,
  }
}
