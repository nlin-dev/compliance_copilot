import { openai } from '../openai'
import type { RetrievalResult } from './retrieve'

const CHAT_MODEL = 'gpt-4o-mini'

const SYSTEM_PROMPT = `You are a CMS Medicare home health compliance expert. Answer questions using ONLY the provided context from the CMS manual. Always cite specific sections.

If the context doesn't contain enough information, say so clearly. Never make up information.`

export interface GenerateOptions {
  query: string
  chunks: RetrievalResult[]
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/**
 * Builds the prompt messages array from query and retrieved chunks.
 */
export function buildPrompt(options: GenerateOptions): ChatMessage[] {
  const { query, chunks } = options

  // Format context from chunks with section citations
  const contextParts = chunks.map((chunk) => {
    const sectionLabel = chunk.subsection
      ? `${chunk.section} - ${chunk.subsection}`
      : chunk.section || `Page ${chunk.pageNumber}`

    return `[${sectionLabel}]\n${chunk.text}`
  })

  const context = contextParts.join('\n---\n')

  const userMessage = `Context:\n${context}\n\nQuestion: ${query}`

  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userMessage },
  ]
}

/**
 * Generates a streaming response using OpenAI chat completions.
 * Yields content chunks as they arrive from the API.
 */
export async function* generateStreamingResponse(
  options: GenerateOptions
): AsyncGenerator<string> {
  const messages = buildPrompt(options)

  const stream = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages,
    stream: true,
  })

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || ''
    if (content) {
      yield content
    }
  }
}
