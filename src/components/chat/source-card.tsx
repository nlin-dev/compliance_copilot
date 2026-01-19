'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import type { MessageSource } from '@/hooks/use-chat-stream'

interface SourceCardProps {
  source: MessageSource
  index: number
}

export function SourceCard({ source, index }: SourceCardProps) {
  const [isOpen, setIsOpen] = useState(false)

  const headerText = [source.section, source.subsection]
    .filter(Boolean)
    .join(' > ') || `Source ${index + 1}`

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-md border bg-muted/50">
        <CollapsibleTrigger className="flex w-full items-center justify-between p-3 text-left text-sm hover:bg-muted/80">
          <div className="flex items-center gap-2">
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="font-medium">{headerText}</span>
          </div>
          <Badge variant="secondary" className="ml-2">
            Page {source.pageNumber}
          </Badge>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t px-3 py-2">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {source.text}
            </p>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
