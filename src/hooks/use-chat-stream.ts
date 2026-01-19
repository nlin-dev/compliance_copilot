import { useState, useCallback, useRef } from 'react'

export interface MessageSource {
  text: string
  pageNumber: number
  section?: string
  subsection?: string
  score: number
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: MessageSource[]
}

// Delimiter used to separate answer text from sources JSON in the stream
const SOURCES_MARKER = '\n__SOURCES__\n'

export interface UseChatStreamReturn {
  messages: Message[]
  isStreaming: boolean
  error: string | null
  sendMessage: (query: string) => Promise<void>
  clearMessages: () => void
}

export function useChatStream(): UseChatStreamReturn {
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isStreamingRef = useRef(false)

  const sendMessage = useCallback(async (query: string) => {
    const trimmedQuery = query.trim()
    if (!trimmedQuery || isStreamingRef.current) {
      return
    }

    setError(null)
    setIsStreaming(true)
    isStreamingRef.current = true

    // Add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmedQuery,
    }
    setMessages((prev) => [...prev, userMessage])

    // Create assistant message placeholder
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
    }

    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: trimmedQuery }),
      })

      if (!response.ok) {
        throw new Error('Request failed')
      }

      // Add the assistant message to state
      setMessages((prev) => [...prev, assistantMessage])

      // Stream the response
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      const decoder = new TextDecoder()
      let content = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        content += chunk

        // Update the assistant message content
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessage.id ? { ...msg, content } : msg
          )
        )
      }

      // Parse sources from stream after completion
      let answerText = content
      let sources: MessageSource[] | undefined

      if (content.includes(SOURCES_MARKER)) {
        const [answer, sourcesJson] = content.split(SOURCES_MARKER)
        answerText = answer
        try {
          sources = JSON.parse(sourcesJson)
        } catch {
          // Invalid JSON, sources will remain undefined
        }
      }

      // Final update with parsed content and sources
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessage.id
            ? { ...msg, content: answerText, sources }
            : msg
        )
      )
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
    } finally {
      setIsStreaming(false)
      isStreamingRef.current = false
    }
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    clearMessages,
  }
}
