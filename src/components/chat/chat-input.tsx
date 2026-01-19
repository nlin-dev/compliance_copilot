'use client'

import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { PaperPlaneRight, FileText } from '@phosphor-icons/react/dist/ssr'

const MAX_CHARS = 1000

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState('')

  const charCount = input.length
  const isOverLimit = charCount > MAX_CHARS
  const isEmpty = input.trim().length === 0

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!isEmpty && !isOverLimit && !disabled) {
      onSend(input.trim())
      setInput('')
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="relative">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about CMS requirements, coverage policies, or documentation standards..."
          className="min-h-[80px] resize-none pr-12 text-sm border-border focus:border-primary transition-colors"
          disabled={disabled}
        />
        <div className="absolute bottom-2 right-2">
          <Button
            type="submit"
            size="icon"
            className="h-8 w-8 transition-all"
            disabled={disabled || isEmpty || isOverLimit}
          >
            <PaperPlaneRight weight="fill" className="h-3.5 w-3.5" />
            <span className="sr-only">Send message</span>
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <FileText weight="fill" className="h-3 w-3" />
          <span>CMS Medicare Benefit Policy Manual, Ch. 7</span>
        </div>
        <span
          className={cn(
            'text-xs font-mono',
            isOverLimit ? 'text-destructive' : 'text-muted-foreground'
          )}
        >
          {charCount}/{MAX_CHARS}
        </span>
      </div>
    </form>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
