import { describe, it, expect, vi } from 'vitest'
import { aggregateFindings } from './analyze'
import type { ComplianceFinding } from '@/schemas/compliance'

// Mock dependencies
vi.mock('./extract', () => ({
  extractClaims: vi.fn(),
}))

vi.mock('./judge', () => ({
  judgeCompliance: vi.fn(),
}))

vi.mock('../retrieval/embed', () => ({
  embedQuery: vi.fn(),
}))

vi.mock('../retrieval/retrieve', () => ({
  retrieveChunks: vi.fn(),
}))

describe('aggregateFindings', () => {
  it('returns PASS when all findings PASS', () => {
    const findings: ComplianceFinding[] = [
      {
        category: 'homebound_status',
        status: 'PASS',
        requirement: 'Patient must be homebound',
        explanation: 'Patient clearly documented as homebound',
        sources: [],
      },
      {
        category: 'skilled_nursing_need',
        status: 'PASS',
        requirement: 'Skilled nursing required',
        explanation: 'Wound care documented',
        sources: [],
      },
    ]

    const result = aggregateFindings(findings)
    expect(result.overallStatus).toBe('PASS')
  })

  it('returns FAIL when a critical category fails', () => {
    const findings: ComplianceFinding[] = [
      {
        category: 'homebound_status',
        status: 'FAIL',
        requirement: 'Patient must be homebound',
        explanation: 'No homebound documentation found',
        sources: [],
      },
      {
        category: 'documentation',
        status: 'PASS',
        requirement: 'Documentation required',
        explanation: 'Complete documentation',
        sources: [],
      },
    ]

    const result = aggregateFindings(findings)
    expect(result.overallStatus).toBe('FAIL')
  })

  it('returns NEEDS_REVIEW when non-critical category fails', () => {
    const findings: ComplianceFinding[] = [
      {
        category: 'homebound_status',
        status: 'PASS',
        requirement: 'Patient must be homebound',
        explanation: 'Homebound documented',
        sources: [],
      },
      {
        category: 'documentation',
        status: 'FAIL',
        requirement: 'Complete documentation',
        explanation: 'Missing signature',
        sources: [],
      },
    ]

    const result = aggregateFindings(findings)
    expect(result.overallStatus).toBe('NEEDS_REVIEW')
  })

  it('returns NEEDS_REVIEW when any finding is NEEDS_REVIEW', () => {
    const findings: ComplianceFinding[] = [
      {
        category: 'homebound_status',
        status: 'PASS',
        requirement: 'Patient must be homebound',
        explanation: 'Homebound documented',
        sources: [],
      },
      {
        category: 'face_to_face',
        status: 'NEEDS_REVIEW',
        requirement: 'Face-to-face encounter',
        explanation: 'Unclear documentation',
        sources: [],
      },
    ]

    const result = aggregateFindings(findings)
    expect(result.overallStatus).toBe('NEEDS_REVIEW')
  })

  it('generates appropriate summary for PASS', () => {
    const findings: ComplianceFinding[] = [
      {
        category: 'homebound_status',
        status: 'PASS',
        requirement: 'Patient must be homebound',
        explanation: 'Homebound documented',
        sources: [],
      },
    ]

    const result = aggregateFindings(findings)
    expect(result.summary).toContain('All')
    expect(result.summary).toContain('passed')
  })

  it('generates appropriate summary for FAIL', () => {
    const findings: ComplianceFinding[] = [
      {
        category: 'homebound_status',
        status: 'FAIL',
        requirement: 'Patient must be homebound',
        explanation: 'No documentation',
        sources: [],
      },
    ]

    const result = aggregateFindings(findings)
    expect(result.summary).toContain('fail')
  })
})
