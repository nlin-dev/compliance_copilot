'use client'

import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { CircleNotch } from '@phosphor-icons/react/dist/ssr'
import { ExampleSelector } from './example-selector'

const MIN_CHARS = 50
const MAX_CHARS = 10000

interface ComplianceFormProps {
  onSubmit: (visitNote: string) => void
  isLoading?: boolean
}

export function ComplianceForm({ onSubmit, isLoading }: ComplianceFormProps) {
  const [visitNote, setVisitNote] = useState('')

  const charCount = visitNote.length
  const isUnderMin = charCount > 0 && charCount < MIN_CHARS
  const isOverMax = charCount > MAX_CHARS
  const isValid = charCount >= MIN_CHARS && charCount <= MAX_CHARS

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (isValid && !isLoading) {
      onSubmit(visitNote.trim())
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-heading font-serif">Documentation Audit</h1>
        <p className="text-sm text-muted-foreground">
          Validate visit notes against CMS coverage requirements
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground uppercase tracking-wide">
            Sample Documentation
          </label>
          <ExampleSelector onSelect={setVisitNote} disabled={isLoading} />
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground uppercase tracking-wide">
            Visit Documentation
          </label>
          <div className="relative">
            <Textarea
              value={visitNote}
              onChange={(e) => setVisitNote(e.target.value)}
              placeholder="Paste visit note, assessment, or care documentation..."
              className="min-h-[240px] resize-y text-sm border-border focus:border-primary transition-colors"
              disabled={isLoading}
            />
            {isLoading && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CircleNotch weight="bold" className="h-4 w-4 animate-spin" />
                  Analyzing documentation...
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-between text-xs">
            <span className={cn(
              "text-muted-foreground",
              (isUnderMin || isOverMax) && "text-destructive"
            )}>
              {isUnderMin && `Minimum ${MIN_CHARS} characters required`}
              {isOverMax && `Maximum ${MAX_CHARS} characters exceeded`}
            </span>
            <span className={cn(
              "font-mono",
              (isUnderMin || isOverMax) ? "text-destructive" : "text-muted-foreground"
            )}>
              {charCount.toLocaleString()}/{MAX_CHARS.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            type="submit"
            disabled={!isValid || isLoading}
            className="w-full h-10 text-sm"
          >
            {isLoading ? (
              <>
                <CircleNotch weight="bold" className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Run Compliance Audit'
            )}
          </Button>
          <div className="border border-border p-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground">Analysis scope:</span> Homebound status · Skilled need · Plan of care · Face-to-face · Documentation requirements
            </p>
          </div>
        </div>
      </form>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
