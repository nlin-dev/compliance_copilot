import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useComplianceCheck } from './use-compliance-check'
import type { ComplianceResponse } from '@/schemas/compliance'

describe('useComplianceCheck', () => {
  const originalFetch = global.fetch

  const mockComplianceResponse: ComplianceResponse = {
    overallStatus: 'PASS',
    findings: [
      {
        category: 'homebound_status',
        status: 'PASS',
        requirement: 'Patient must be homebound',
        evidence: 'Patient is confined to home due to mobility issues',
        explanation: 'Documentation clearly states homebound status',
        sources: [],
      },
    ],
    summary: 'Visit note is compliant with CMS requirements',
    processingTime: 1500,
  }

  beforeEach(() => {
    vi.resetAllMocks()
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('should initialize with null result and not loading', () => {
    const { result } = renderHook(() => useComplianceCheck())

    expect(result.current.result).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should check compliance and return result', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockComplianceResponse),
    })

    const { result } = renderHook(() => useComplianceCheck())

    await act(async () => {
      await result.current.checkCompliance('Patient visit note content...')
    })

    expect(result.current.result).toEqual(mockComplianceResponse)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should set isLoading to true during check', async () => {
    let resolveResponse: (value: unknown) => void
    const responsePromise = new Promise((resolve) => {
      resolveResponse = resolve
    })

    global.fetch = vi.fn().mockReturnValue(responsePromise)

    const { result } = renderHook(() => useComplianceCheck())

    act(() => {
      result.current.checkCompliance('Patient visit note content...')
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true)
    })

    await act(async () => {
      resolveResponse!({
        ok: true,
        json: () => Promise.resolve(mockComplianceResponse),
      })
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
  })

  it('should handle API errors', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () =>
        Promise.resolve({
          error: 'Invalid request',
          details: { visitNote: ['Must be at least 50 characters'] },
        }),
    })

    const { result } = renderHook(() => useComplianceCheck())

    await act(async () => {
      await result.current.checkCompliance('short')
    })

    expect(result.current.error).toBe('Invalid request')
    expect(result.current.result).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })

  it('should handle network errors', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useComplianceCheck())

    await act(async () => {
      await result.current.checkCompliance('Patient visit note content that is long enough...')
    })

    expect(result.current.error).toBe('Network error')
    expect(result.current.result).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })

  it('should call correct API endpoint', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockComplianceResponse),
    })

    const visitNote = 'Patient visit note content that meets minimum requirements...'
    const { result } = renderHook(() => useComplianceCheck())

    await act(async () => {
      await result.current.checkCompliance(visitNote)
    })

    expect(global.fetch).toHaveBeenCalledWith('/api/compliance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ visitNote }),
    })
  })

  it('should reset state', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockComplianceResponse),
    })

    const { result } = renderHook(() => useComplianceCheck())

    await act(async () => {
      await result.current.checkCompliance('Patient visit note content...')
    })

    expect(result.current.result).not.toBeNull()

    act(() => {
      result.current.reset()
    })

    expect(result.current.result).toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })

  it('should not make request while already loading', async () => {
    let resolveResponse: (value: unknown) => void
    const responsePromise = new Promise((resolve) => {
      resolveResponse = resolve
    })

    global.fetch = vi.fn().mockReturnValue(responsePromise)

    const { result } = renderHook(() => useComplianceCheck())

    act(() => {
      result.current.checkCompliance('First note content...')
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true)
    })

    // Try to make another request while loading
    await act(async () => {
      await result.current.checkCompliance('Second note content...')
    })

    // Should only have called fetch once
    expect(global.fetch).toHaveBeenCalledTimes(1)

    // Clean up
    await act(async () => {
      resolveResponse!({
        ok: true,
        json: () => Promise.resolve(mockComplianceResponse),
      })
    })
  })

  it('should handle FAIL status responses', async () => {
    const failResponse: ComplianceResponse = {
      ...mockComplianceResponse,
      overallStatus: 'FAIL',
      findings: [
        {
          category: 'homebound_status',
          status: 'FAIL',
          requirement: 'Patient must be homebound',
          explanation: 'No documentation of homebound status found',
          sources: [],
        },
      ],
    }

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(failResponse),
    })

    const { result } = renderHook(() => useComplianceCheck())

    await act(async () => {
      await result.current.checkCompliance('Patient visit note content...')
    })

    expect(result.current.result?.overallStatus).toBe('FAIL')
  })
})
