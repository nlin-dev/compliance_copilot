import { cn } from '@/lib/utils'
import type { Message } from '@/hooks/use-chat-stream'
import { SourceCard } from './source-card'

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const hasSources = !isUser && message.sources && message.sources.length > 0

  return (
    <div className={cn('flex w-full flex-col', isUser ? 'items-end' : 'items-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-4 py-2',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground'
        )}
      >
        <p className="whitespace-pre-wrap text-sm">{message.content}</p>
      </div>

      {hasSources && (
        <div className="mt-3 w-full max-w-[80%] space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Sources ({message.sources!.length})
          </p>
          {message.sources!.map((source, index) => (
            <SourceCard key={index} source={source} index={index} />
          ))}
        </div>
      )}
    </div>
  )
}
