'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { CheckCircle, XCircle, Warning } from '@phosphor-icons/react/dist/ssr'

type Status = 'PASS' | 'FAIL' | 'NEEDS_REVIEW'

interface StatusBadgeProps {
  status: Status
  className?: string
}

const statusConfig = {
  PASS: {
    label: 'Pass',
    variant: 'default' as const,
    className: 'bg-success hover:bg-success text-success-foreground border-0',
    icon: CheckCircle,
  },
  FAIL: {
    label: 'Fail',
    variant: 'destructive' as const,
    className: 'bg-destructive hover:bg-destructive border-0',
    icon: XCircle,
  },
  NEEDS_REVIEW: {
    label: 'Review',
    variant: 'secondary' as const,
    className: 'bg-warning hover:bg-warning text-warning-foreground border-0',
    icon: Warning,
  },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge
      variant={config.variant}
      className={cn(
        'gap-1 px-2 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      <Icon weight="fill" className="h-3 w-3" />
      {config.label}
    </Badge>
  )
}
