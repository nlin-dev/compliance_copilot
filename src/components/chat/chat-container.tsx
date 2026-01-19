'use client'

import { useChatStream } from '@/hooks/use-chat-stream'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { MessageList } from './message-list'
import { ChatInput } from './chat-input'
import { Warning, Trash } from '@phosphor-icons/react/dist/ssr'

export function ChatContainer() {
  const { messages, isStreaming, error, sendMessage, clearMessages } =
    useChatStream()

  return (
    <div className="flex h-[calc(100vh-14rem)] flex-col border border-border">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h1 className="text-heading font-serif">Regulatory Intelligence</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Query CMS requirements and documentation standards
          </p>
        </div>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearMessages}
            disabled={isStreaming}
            className="text-xs gap-2 hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash weight="bold" className="w-3.5 h-3.5" />
            Clear
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <MessageList
          messages={messages}
          isStreaming={isStreaming}
          onSendMessage={sendMessage}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="px-6 py-3 border-t border-border">
          <Alert variant="destructive" className="py-2">
            <Warning weight="bold" className="h-3.5 w-3.5" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Input */}
      <div className="px-6 py-4 border-t border-border">
        <ChatInput onSend={sendMessage} disabled={isStreaming} />
      </div>
    </div>
  )
}
