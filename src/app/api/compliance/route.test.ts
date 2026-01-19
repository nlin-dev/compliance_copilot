import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import type { ComplianceResponse } from '@/schemas/compliance'

// Mock dependencies
vi.mock('@/lib/compliance/analyze', () => ({
  analyzeCompliance: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    auditLog: {
      create: vi.fn(),
    },
  },
}))

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue('127.0.0.1'),
  }),
}))

import { analyzeCompliance } from '@/lib/compliance/analyze'
import { prisma } from '@/lib/prisma'

describe('POST /api/compliance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 for invalid request body', async () => {
    const request = new Request('http://localhost/api/compliance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitNote: 'too short' }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)

    const json = await response.json()
    expect(json.error).toBe('Invalid request')
  })

  it('returns 200 with compliance response for valid request', async () => {
    const mockResponse: ComplianceResponse = {
      overallStatus: 'PASS',
      findings: [],
      summary: 'All categories passed',
      processingTime: 100,
    }

    vi.mocked(analyzeCompliance).mockResolvedValue(mockResponse)

    const validNote = 'a'.repeat(100) // At least 50 chars

    const request = new Request('http://localhost/api/compliance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitNote: validNote }),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json.overallStatus).toBe('PASS')
    expect(json.processingTime).toBeDefined()
  })

  it('logs to audit table in background', async () => {
    const mockResponse: ComplianceResponse = {
      overallStatus: 'PASS',
      findings: [],
      summary: 'All categories passed',
      processingTime: 100,
    }

    vi.mocked(analyzeCompliance).mockResolvedValue(mockResponse)

    const validNote = 'a'.repeat(100)

    const request = new Request('http://localhost/api/compliance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitNote: validNote }),
    })

    await POST(request)

    // Give time for background logging
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(prisma.auditLog.create).toHaveBeenCalled()
  })
})
