'use client'

import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Check Visit Note Compliance</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Try an example or paste your own note
            </p>
            <ExampleSelector onSelect={setVisitNote} disabled={isLoading} />
          </div>
          <div>
            <Textarea
              value={visitNote}
              onChange={(e) => setVisitNote(e.target.value)}
              placeholder="Paste the visit note here to check for CMS Medicare compliance..."
              className="min-h-[200px] resize-y"
              disabled={isLoading}
            />
            <div className="mt-1 flex justify-between text-xs">
              <span className="text-muted-foreground">
                {isUnderMin && (
                  <span className="text-destructive">
                    Minimum {MIN_CHARS} characters required
                  </span>
                )}
                {isOverMax && (
                  <span className="text-destructive">
                    Maximum {MAX_CHARS} characters exceeded
                  </span>
                )}
              </span>
              <span
                className={
                  isUnderMin || isOverMax
                    ? 'text-destructive'
                    : 'text-muted-foreground'
                }
              >
                {charCount.toLocaleString()}/{MAX_CHARS.toLocaleString()}
              </span>
            </div>
          </div>
          <Button type="submit" disabled={!isValid || isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Analyzing...' : 'Check Compliance'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
