import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import type { QuerySource } from '@/lib/schemas/query'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    auditLog: {
      create: vi.fn(),
    },
  },
}))

vi.mock('@/lib/ratelimit', () => ({
  queryRatelimit: {
    limit: vi.fn().mockResolvedValue({
      success: true,
      limit: 100,
      remaining: 99,
      reset: Date.now() + 60_000,
    }),
  },
}))

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue('127.0.0.1'),
  }),
}))

vi.mock('@/lib/retrieval/cache', () => ({
  getCachedResponse: vi.fn(),
  cacheResponse: vi.fn(),
}))

vi.mock('@/lib/retrieval/embed', () => ({
  embedQuery: vi.fn().mockResolvedValue([0.1, 0.2, 0.3]),
}))

vi.mock('@/lib/retrieval/retrieve', () => ({
  retrieveChunks: vi.fn(),
}))

vi.mock('@/lib/retrieval/generate', () => ({
  generateStreamingResponse: vi.fn(),
}))

import { prisma } from '@/lib/prisma'
import { getCachedResponse } from '@/lib/retrieval/cache'
import { retrieveChunks } from '@/lib/retrieval/retrieve'

describe('POST /api/query', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns a 200 streamed message (not 404) when no chunks are found', async () => {
    vi.mocked(getCachedResponse).mockResolvedValue(null)
    vi.mocked(retrieveChunks).mockResolvedValue([])

    const request = new Request('http://localhost/api/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'test' }),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
    expect(response.headers.get('X-No-Results')).toBe('1')

    const body = await response.text()
    expect(body).toContain('\n__SOURCES__\n')

    const [answer, sourcesJson] = body.split('\n__SOURCES__\n')
    expect(answer).toContain("couldn't find relevant information")
    expect(JSON.parse(sourcesJson)).toEqual([])
  })

  it('returns a 200 streamed response for cache hits', async () => {
    const sources: QuerySource[] = [
      {
        text: 'source text',
        pageNumber: 1,
        section: '10.1',
        subsection: 'A',
        score: 0.9,
      },
    ]

    vi.mocked(getCachedResponse).mockResolvedValue({
      answer: 'cached answer',
      sources,
    })

    const request = new Request('http://localhost/api/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'test' }),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
    expect(response.headers.get('X-Cache')).toBe('HIT')

    const body = await response.text()
    const [answer, sourcesJson] = body.split('\n__SOURCES__\n')
    expect(answer).toBe('cached answer')
    expect(JSON.parse(sourcesJson)).toEqual(sources)

    expect(prisma.auditLog.create).toHaveBeenCalled()
  })
})
