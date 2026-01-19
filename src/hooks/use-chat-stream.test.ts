import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useChatStream } from './use-chat-stream'

describe('useChatStream', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    vi.resetAllMocks()
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('should initialize with empty messages and not streaming', () => {
    const { result } = renderHook(() => useChatStream())

    expect(result.current.messages).toEqual([])
    expect(result.current.isStreaming).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should add user message when sending', async () => {
    const mockStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('Hello'))
        controller.close()
      },
    })

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: mockStream,
    })

    const { result } = renderHook(() => useChatStream())

    await act(async () => {
      await result.current.sendMessage('Test question')
    })

    expect(result.current.messages[0]).toMatchObject({
      role: 'user',
      content: 'Test question',
    })
    expect(result.current.messages[0].id).toBeDefined()
  })

  it('should stream assistant response', async () => {
    const chunks = ['Hello', ' ', 'world', '!']
    let chunkIndex = 0

    const mockStream = new ReadableStream({
      pull(controller) {
        if (chunkIndex < chunks.length) {
          controller.enqueue(new TextEncoder().encode(chunks[chunkIndex]))
          chunkIndex++
        } else {
          controller.close()
        }
      },
    })

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: mockStream,
    })

    const { result } = renderHook(() => useChatStream())

    await act(async () => {
      await result.current.sendMessage('Test question')
    })

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(2)
      expect(result.current.messages[1].content).toBe('Hello world!')
    })
  })

  it('should set isStreaming to true during streaming', async () => {
    let resolveStream: () => void
    const streamPromise = new Promise<void>((resolve) => {
      resolveStream = resolve
    })

    const mockStream = new ReadableStream({
      async start(controller) {
        controller.enqueue(new TextEncoder().encode('Streaming...'))
        await streamPromise
        controller.close()
      },
    })

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: mockStream,
    })

    const { result } = renderHook(() => useChatStream())

    act(() => {
      result.current.sendMessage('Test question')
    })

    await waitFor(() => {
      expect(result.current.isStreaming).toBe(true)
    })

    await act(async () => {
      resolveStream!()
    })

    await waitFor(() => {
      expect(result.current.isStreaming).toBe(false)
    })
  })

  it('should handle API errors', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Internal server error' }),
    })

    const { result } = renderHook(() => useChatStream())

    await act(async () => {
      await result.current.sendMessage('Test question')
    })

    expect(result.current.error).toBe('Request failed')
    expect(result.current.isStreaming).toBe(false)
  })

  it('should handle network errors', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useChatStream())

    await act(async () => {
      await result.current.sendMessage('Test question')
    })

    expect(result.current.error).toBe('Network error')
    expect(result.current.isStreaming).toBe(false)
  })

  it('should clear messages', async () => {
    const mockStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('Hello'))
        controller.close()
      },
    })

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: mockStream,
    })

    const { result } = renderHook(() => useChatStream())

    await act(async () => {
      await result.current.sendMessage('Test question')
    })

    expect(result.current.messages.length).toBeGreaterThan(0)

    act(() => {
      result.current.clearMessages()
    })

    expect(result.current.messages).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('should call correct API endpoint', async () => {
    const mockStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('response'))
        controller.close()
      },
    })

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: mockStream,
    })

    const { result } = renderHook(() => useChatStream())

    await act(async () => {
      await result.current.sendMessage('Test question')
    })

    expect(global.fetch).toHaveBeenCalledWith('/api/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: 'Test question' }),
    })
  })

  it('should not send empty messages', async () => {
    global.fetch = vi.fn()

    const { result } = renderHook(() => useChatStream())

    await act(async () => {
      await result.current.sendMessage('')
    })

    expect(global.fetch).not.toHaveBeenCalled()
    expect(result.current.messages).toEqual([])
  })

  it('should not send while already streaming', async () => {
    let resolveStream: () => void
    const streamPromise = new Promise<void>((resolve) => {
      resolveStream = resolve
    })

    const mockStream = new ReadableStream({
      async start(controller) {
        controller.enqueue(new TextEncoder().encode('First'))
        await streamPromise
        controller.close()
      },
    })

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: mockStream,
    })

    const { result } = renderHook(() => useChatStream())

    act(() => {
      result.current.sendMessage('First question')
    })

    await waitFor(() => {
      expect(result.current.isStreaming).toBe(true)
    })

    // Try to send another message while streaming
    await act(async () => {
      await result.current.sendMessage('Second question')
    })

    // Should only have called fetch once
    expect(global.fetch).toHaveBeenCalledTimes(1)

    // Clean up
    await act(async () => {
      resolveStream!()
    })
  })

  describe('sources parsing', () => {
    const mockSources = [
      {
        text: 'Sample source text',
        pageNumber: 42,
        section: 'Chapter 7',
        subsection: 'Section A',
        score: 0.95,
      },
      {
        text: 'Another source',
        pageNumber: 100,
        section: 'Chapter 10',
        subsection: 'Section B',
        score: 0.87,
      },
    ]

    it('should parse sources from stream with __SOURCES__ delimiter', async () => {
      const answerText = 'This is the answer'
      const streamContent = `${answerText}\n__SOURCES__\n${JSON.stringify(mockSources)}`

      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(streamContent))
          controller.close()
        },
      })

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: mockStream,
      })

      const { result } = renderHook(() => useChatStream())

      await act(async () => {
        await result.current.sendMessage('Test question')
      })

      await waitFor(() => {
        expect(result.current.messages).toHaveLength(2)
        const assistantMessage = result.current.messages[1]
        expect(assistantMessage.content).toBe(answerText)
        expect(assistantMessage.sources).toEqual(mockSources)
      })
    })

    it('should handle stream without sources marker', async () => {
      const answerText = 'This is a response without sources'

      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(answerText))
          controller.close()
        },
      })

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: mockStream,
      })

      const { result } = renderHook(() => useChatStream())

      await act(async () => {
        await result.current.sendMessage('Test question')
      })

      await waitFor(() => {
        expect(result.current.messages).toHaveLength(2)
        const assistantMessage = result.current.messages[1]
        expect(assistantMessage.content).toBe(answerText)
        expect(assistantMessage.sources).toBeUndefined()
      })
    })

    it('should handle sources streaming in chunks', async () => {
      const answerText = 'Chunked answer'
      const sourcesJson = JSON.stringify(mockSources)
      const chunks = [
        'Chunked ',
        'answer',
        '\n__SOURCES__\n',
        sourcesJson.slice(0, 50),
        sourcesJson.slice(50),
      ]
      let chunkIndex = 0

      const mockStream = new ReadableStream({
        pull(controller) {
          if (chunkIndex < chunks.length) {
            controller.enqueue(new TextEncoder().encode(chunks[chunkIndex]))
            chunkIndex++
          } else {
            controller.close()
          }
        },
      })

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: mockStream,
      })

      const { result } = renderHook(() => useChatStream())

      await act(async () => {
        await result.current.sendMessage('Test question')
      })

      await waitFor(() => {
        expect(result.current.messages).toHaveLength(2)
        const assistantMessage = result.current.messages[1]
        expect(assistantMessage.content).toBe(answerText)
        expect(assistantMessage.sources).toEqual(mockSources)
      })
    })

    it('should handle invalid JSON in sources gracefully', async () => {
      const answerText = 'Answer with bad sources'
      const streamContent = `${answerText}\n__SOURCES__\n{invalid json}`

      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(streamContent))
          controller.close()
        },
      })

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: mockStream,
      })

      const { result } = renderHook(() => useChatStream())

      await act(async () => {
        await result.current.sendMessage('Test question')
      })

      await waitFor(() => {
        expect(result.current.messages).toHaveLength(2)
        const assistantMessage = result.current.messages[1]
        // Should still have the answer text
        expect(assistantMessage.content).toBe(answerText)
        // Sources should be undefined if parsing fails
        expect(assistantMessage.sources).toBeUndefined()
      })
    })
  })
})
