'use client'

import { StatusBadge } from './status-badge'
import { FindingCard } from './finding-card'
import type { ComplianceResponse } from '@/schemas/compliance'
import { CheckCircle, XCircle, Warning, Clock } from '@phosphor-icons/react/dist/ssr'

interface FindingsDisplayProps {
  result: ComplianceResponse
}

export function FindingsDisplay({ result }: FindingsDisplayProps) {
  const passCount = result.findings.filter((f) => f.status === 'PASS').length
  const failCount = result.findings.filter((f) => f.status === 'FAIL').length
  const reviewCount = result.findings.filter(
    (f) => f.status === 'NEEDS_REVIEW'
  ).length

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="border border-border p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-heading font-serif">Compliance Summary</h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
              {result.summary}
            </p>
          </div>
          <StatusBadge status={result.overallStatus} />
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
          <div className="flex items-center gap-3">
            <CheckCircle weight="fill" className="h-5 w-5 text-success" />
            <div>
              <div className="text-xl font-mono font-bold text-success">{passCount}</div>
              <div className="text-xs text-muted-foreground">Passed</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <XCircle weight="fill" className="h-5 w-5 text-destructive" />
            <div>
              <div className="text-xl font-mono font-bold text-destructive">{failCount}</div>
              <div className="text-xs text-muted-foreground">Failed</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Warning weight="fill" className="h-5 w-5 text-warning" />
            <div>
              <div className="text-xl font-mono font-bold text-warning">{reviewCount}</div>
              <div className="text-xs text-muted-foreground">Review</div>
            </div>
          </div>
        </div>

        {/* Processing Time */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-3 border-t border-border">
          <Clock weight="bold" className="h-3 w-3" />
          <span className="font-mono">
            {(result.processingTime / 1000).toFixed(2)}s processing time
          </span>
        </div>
      </div>

      {/* Findings List */}
      <div className="space-y-3">
        {result.findings.map((finding, index) => (
          <FindingCard key={`${finding.category}-${index}`} finding={finding} />
        ))}
      </div>
    </div>
  )
}
