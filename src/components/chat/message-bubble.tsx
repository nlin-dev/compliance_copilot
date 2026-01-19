'use client'

import { cn } from '@/lib/utils'
import type { Message } from '@/hooks/use-chat-stream'
import { SourceCard } from './source-card'
import { User, Robot } from '@phosphor-icons/react/dist/ssr'

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const hasSources = !isUser && message.sources && message.sources.length > 0

  return (
    <div className={cn('flex w-full gap-3 py-4', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="flex-shrink-0">
          <Robot weight="fill" className="w-4 h-4 text-primary" />
        </div>
      )}
      <div className={cn('flex flex-col', isUser ? 'items-end' : 'items-start', 'max-w-[85%]')}>
        <div
          className={cn(
            'px-4 py-2 border',
            isUser
              ? 'bg-primary/5 border-primary/20 text-foreground'
              : 'bg-transparent border-border'
          )}
        >
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
        </div>

        {hasSources && (
          <div className="mt-4 w-full space-y-2">
            <p className="text-caption text-muted-foreground">
              Sources ({message.sources!.length})
            </p>
            <div className="space-y-1.5">
              {message.sources!.map((source, index) => (
                <SourceCard key={index} source={source} index={index} />
              ))}
            </div>
          </div>
        )}
      </div>
      {isUser && (
        <div className="flex-shrink-0">
          <User weight="fill" className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
    </div>
  )
}
