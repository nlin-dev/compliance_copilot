import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

interface MessageSkeletonProps {
  role: 'user' | 'assistant'
}

export function MessageSkeleton({ role }: MessageSkeletonProps) {
  const isUser = role === 'user'

  return (
    <div
      data-testid={`message-skeleton-${role}`}
      className={cn('flex w-full flex-col', isUser ? 'items-end' : 'items-start')}
    >
      {/* Message bubble skeleton */}
      <div
        className={cn(
          'rounded-lg px-4 py-2',
          isUser ? 'max-w-[60%]' : 'max-w-[80%]'
        )}
      >
        <Skeleton className={cn('h-4', isUser ? 'w-32' : 'w-48')} />
        {!isUser && <Skeleton className="mt-2 h-4 w-40" />}
      </div>

      {/* Source card placeholder for assistant messages */}
      {!isUser && (
        <div data-testid="source-skeleton" className="mt-3 w-full max-w-[80%] space-y-2">
          <Skeleton className="h-3 w-20" />
          <div className="rounded-md border bg-muted/50 p-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function ChatLoadingSkeleton() {
  return (
    <div data-testid="chat-loading-skeleton" className="flex flex-col gap-4 p-4">
      {/* First conversation pair */}
      <MessageSkeleton role="user" />
      <MessageSkeleton role="assistant" />

      {/* Second conversation pair */}
      <MessageSkeleton role="user" />
      <MessageSkeleton role="assistant" />
    </div>
  )
}
