import { useState, useCallback, useRef } from 'react'
import type { ComplianceResponse } from '@/schemas/compliance'

export interface UseComplianceCheckReturn {
  result: ComplianceResponse | null
  isLoading: boolean
  error: string | null
  checkCompliance: (visitNote: string) => Promise<void>
  reset: () => void
}

export function useComplianceCheck(): UseComplianceCheckReturn {
  const [result, setResult] = useState<ComplianceResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isLoadingRef = useRef(false)

  const checkCompliance = useCallback(async (visitNote: string) => {
    if (isLoadingRef.current) {
      return
    }

    setError(null)
    setIsLoading(true)
    isLoadingRef.current = true

    try {
      const response = await fetch('/api/compliance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ visitNote }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Request failed')
      }

      setResult(data as ComplianceResponse)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      setResult(null)
    } finally {
      setIsLoading(false)
      isLoadingRef.current = false
    }
  }, [])

  const reset = useCallback(() => {
    setResult(null)
    setError(null)
    setIsLoading(false)
    isLoadingRef.current = false
  }, [])

  return {
    result,
    isLoading,
    error,
    checkCompliance,
    reset,
  }
}
