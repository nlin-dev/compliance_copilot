import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

import { prisma } from '@/lib/prisma'
import { queryRatelimit } from '@/lib/ratelimit'
import { QueryRequestSchema, type QuerySource } from '@/lib/schemas/query'
import { embedQuery } from '@/lib/retrieval/embed'
import { retrieveChunks } from '@/lib/retrieval/retrieve'
import { generateStreamingResponse } from '@/lib/retrieval/generate'
import { getCachedResponse, cacheResponse } from '@/lib/retrieval/cache'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Delimiter used to separate answer text from sources JSON in the stream
const SOURCES_MARKER = '\n__SOURCES__\n'

function streamTextWithSources(answer: string, sources: QuerySource[]): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()
      controller.enqueue(encoder.encode(answer))
      controller.enqueue(encoder.encode(SOURCES_MARKER))
      controller.enqueue(encoder.encode(JSON.stringify(sources)))
      controller.close()
    },
  })
}

// CORS headers for API responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

/**
 * OPTIONS /api/query - Handle CORS preflight
 */
export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  })
}

/**
 * POST /api/query - Query the CMS compliance knowledge base
 */
export async function POST(request: Request): Promise<Response> {
  const startTime = Date.now()
  let queryText: string | undefined
  let chunksUsed = 0

  try {
    // Parse and validate request body
    const body = await request.json()
    const parseResult = QueryRequestSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parseResult.error.flatten() },
        { status: 400, headers: corsHeaders }
      )
    }

    const { query } = parseResult.data
    queryText = query

    // Get client IP for rate limiting
    const headersList = await headers()
    const clientIp =
      headersList.get('x-forwarded-for')?.split(',')[0] ??
      headersList.get('x-real-ip') ??
      'unknown'

    // Check rate limit
    const rateLimitResult = await queryRatelimit.limit(clientIp)
    if (!rateLimitResult.success) {
      await logRequest({
        endpoint: '/api/query',
        method: 'POST',
        clientIp,
        userAgent: headersList.get('user-agent'),
        queryText,
        chunksUsed: 0,
        responseCode: 429,
        responseTime: Date.now() - startTime,
      })

      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
          },
        }
      )
    }

    // Check cache
    const cached = await getCachedResponse(query)
    if (cached) {
      await logRequest({
        endpoint: '/api/query',
        method: 'POST',
        clientIp,
        userAgent: headersList.get('user-agent'),
        queryText,
        chunksUsed: cached.sources.length,
        responseCode: 200,
        responseTime: Date.now() - startTime,
      })

      const stream = streamTextWithSources(cached.answer, cached.sources)

      return new Response(stream, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Response-Time': `${Date.now() - startTime}ms`,
          'X-Cache': 'HIT',
        },
      })
    }

    // Embed the query
    const embedding = await embedQuery(query)

    // Retrieve relevant chunks
    const chunks = await retrieveChunks(embedding)
    chunksUsed = chunks.length

    if (chunks.length === 0) {
      await logRequest({
        endpoint: '/api/query',
        method: 'POST',
        clientIp,
        userAgent: headersList.get('user-agent'),
        queryText,
        chunksUsed: 0,
        responseCode: 200,
        responseTime: Date.now() - startTime,
      })

      const stream = streamTextWithSources(
        "I couldn't find relevant information for your query in the indexed CMS content. Try rephrasing your question or ingesting additional documents.",
        []
      )

      return new Response(stream, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Response-Time': `${Date.now() - startTime}ms`,
          'X-No-Results': '1',
        },
      })
    }

    // Convert chunks to sources for response
    const sources: QuerySource[] = chunks.map((chunk) => ({
      text: chunk.text,
      pageNumber: chunk.pageNumber,
      section: chunk.section,
      subsection: chunk.subsection,
      score: chunk.score,
    }))

    // Stream the response
    let fullAnswer = ''

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()

        try {
          for await (const chunk of generateStreamingResponse({ query, chunks })) {
            fullAnswer += chunk
            controller.enqueue(encoder.encode(chunk))
          }

          // Append sources marker and JSON after all content chunks
          controller.enqueue(encoder.encode(SOURCES_MARKER))
          controller.enqueue(encoder.encode(JSON.stringify(sources)))
          controller.close()

          // Cache the complete response in the background
          cacheResponse(query, { answer: fullAnswer, sources }).catch(() => {
            // Silently ignore cache errors
          })

          // Log the successful request
          logRequest({
            endpoint: '/api/query',
            method: 'POST',
            clientIp,
            userAgent: headersList.get('user-agent'),
            queryText,
            chunksUsed,
            responseCode: 200,
            responseTime: Date.now() - startTime,
          }).catch(() => {
            // Silently ignore logging errors
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          controller.error(error)

          logRequest({
            endpoint: '/api/query',
            method: 'POST',
            clientIp,
            userAgent: headersList.get('user-agent'),
            queryText,
            chunksUsed,
            responseCode: 500,
            responseTime: Date.now() - startTime,
            errorMessage,
          }).catch(() => {
            // Silently ignore logging errors
          })
        }
      },
    })

    return new Response(stream, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Response-Time': `${Date.now() - startTime}ms`,
        'X-Cache': 'MISS',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[query] Error:', errorMessage)

    const headersList = await headers()
    const clientIp =
      headersList.get('x-forwarded-for')?.split(',')[0] ??
      headersList.get('x-real-ip') ??
      'unknown'

    await logRequest({
      endpoint: '/api/query',
      method: 'POST',
      clientIp,
      userAgent: headersList.get('user-agent'),
      queryText,
      chunksUsed,
      responseCode: 500,
      responseTime: Date.now() - startTime,
      errorMessage,
    })

    return NextResponse.json(
      { error: 'Internal server error' },
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'X-Response-Time': `${Date.now() - startTime}ms`,
        },
      }
    )
  }
}

interface LogRequestParams {
  endpoint: string
  method: string
  clientIp: string
  userAgent: string | null
  queryText?: string
  chunksUsed: number
  responseCode: number
  responseTime: number
  errorMessage?: string
}

async function logRequest(params: LogRequestParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        endpoint: params.endpoint,
        method: params.method,
        clientIp: params.clientIp,
        userAgent: params.userAgent,
        queryText: params.queryText,
        chunksUsed: params.chunksUsed,
        responseCode: params.responseCode,
        responseTime: params.responseTime,
        errorMessage: params.errorMessage,
      },
    })
  } catch (error) {
    console.error('[audit] Failed to log request:', error)
  }
}
