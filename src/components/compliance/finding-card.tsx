'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { StatusBadge } from './status-badge'
import type { ComplianceFinding } from '@/schemas/compliance'
import { CaretDown, House, FirstAidKit, ClipboardText, Handshake, FileText } from '@phosphor-icons/react/dist/ssr'

interface FindingCardProps {
  finding: ComplianceFinding
}

const categoryLabels: Record<string, string> = {
  homebound_status: 'Homebound Status',
  skilled_nursing_need: 'Skilled Nursing Need',
  plan_of_care: 'Plan of Care',
  face_to_face: 'Face-to-Face Encounter',
  documentation: 'Documentation',
}

const categoryIcons: Record<string, typeof House> = {
  homebound_status: House,
  skilled_nursing_need: FirstAidKit,
  plan_of_care: ClipboardText,
  face_to_face: Handshake,
  documentation: FileText,
}

export function FindingCard({ finding }: FindingCardProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const Icon = categoryIcons[finding.category] ?? FileText

  return (
    <div className="border border-border overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <Icon weight="fill" className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium text-foreground">
            {categoryLabels[finding.category] ?? finding.category}
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={finding.status} />
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <CaretDown weight="bold" className="h-3.5 w-3.5 text-muted-foreground" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-border pt-4">
              <div>
                <p className="text-caption text-muted-foreground mb-1">
                  Requirement
                </p>
                <p className="text-sm leading-relaxed">
                  {finding.requirement}
                </p>
              </div>
              {finding.evidence && (
                <div>
                  <p className="text-caption text-muted-foreground mb-1">
                    Evidence
                  </p>
                  <div className="border border-border p-3 bg-muted/30">
                    <p className="text-sm italic leading-relaxed">
                      &ldquo;{finding.evidence}&rdquo;
                    </p>
                  </div>
                </div>
              )}
              <div>
                <p className="text-caption text-muted-foreground mb-1">
                  Explanation
                </p>
                <p className="text-sm leading-relaxed">
                  {finding.explanation}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
