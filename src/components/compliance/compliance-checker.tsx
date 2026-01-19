'use client'

import { useComplianceCheck } from '@/hooks/use-compliance-check'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ComplianceForm } from '@/components/compliance/compliance-form'
import { FindingsDisplay } from '@/components/compliance/findings-display'
import { FindingsSkeleton } from '@/components/compliance/findings-skeleton'
import { AlertCircle, ArrowLeft } from 'lucide-react'

export function ComplianceChecker() {
  const { result, isLoading, error, checkCompliance, reset } =
    useComplianceCheck()

  return (
    <div className="space-y-6">
      {!result ? (
        <>
          <ComplianceForm onSubmit={checkCompliance} isLoading={isLoading} />
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {isLoading && <FindingsSkeleton />}
        </>
      ) : (
        <>
          <Button variant="ghost" onClick={reset} className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Check Another Note
          </Button>
          <FindingsDisplay result={result} />
        </>
      )}
    </div>
  )
}
