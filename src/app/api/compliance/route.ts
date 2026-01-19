import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

import { prisma } from '@/lib/prisma'
import {
  ComplianceRequestSchema,
  ComplianceResponse,
} from '@/schemas/compliance'
import { analyzeCompliance } from '@/lib/compliance/analyze'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/compliance - Check visit note compliance against CMS requirements
 */
export async function POST(request: Request): Promise<Response> {
  const startTime = Date.now()
  let visitNoteLength: number | undefined
  let categoriesChecked: string[] | undefined
  let overallStatus: string | undefined

  try {
    // Parse and validate request body
    const body = await request.json()
    const parseResult = ComplianceRequestSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parseResult.error.flatten() },
        { status: 400 }
      )
    }

    const { visitNote, categories } = parseResult.data
    visitNoteLength = visitNote.length
    categoriesChecked = categories

    // Get client IP for logging
    const headersList = await headers()
    const clientIp =
      headersList.get('x-forwarded-for')?.split(',')[0] ??
      headersList.get('x-real-ip') ??
      'unknown'

    // Analyze compliance
    const result: ComplianceResponse = await analyzeCompliance(visitNote, categories)
    overallStatus = result.overallStatus

    const processingTime = Date.now() - startTime

    // Log in background (don't block response)
    logRequest({
      endpoint: '/api/compliance',
      method: 'POST',
      clientIp,
      userAgent: headersList.get('user-agent'),
      visitNoteLength,
      categoriesChecked,
      overallStatus,
      responseCode: 200,
      responseTime: processingTime,
    }).catch(() => {
      // Silently ignore logging errors
    })

    return NextResponse.json(
      {
        ...result,
        processingTime, // Use actual processing time
      },
      {
        status: 200,
        headers: {
          'X-Response-Time': `${processingTime}ms`,
        },
      }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[compliance] Error:', errorMessage)

    const processingTime = Date.now() - startTime

    const headersList = await headers()
    const clientIp =
      headersList.get('x-forwarded-for')?.split(',')[0] ??
      headersList.get('x-real-ip') ??
      'unknown'

    // Log error
    await logRequest({
      endpoint: '/api/compliance',
      method: 'POST',
      clientIp,
      userAgent: headersList.get('user-agent'),
      visitNoteLength,
      categoriesChecked,
      overallStatus,
      responseCode: 500,
      responseTime: processingTime,
      errorMessage,
    })

    return NextResponse.json(
      { error: 'Internal server error' },
      {
        status: 500,
        headers: {
          'X-Response-Time': `${processingTime}ms`,
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
  visitNoteLength?: number
  categoriesChecked?: string[]
  overallStatus?: string
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
        // Store compliance-specific metadata in queryText field as JSON
        queryText: JSON.stringify({
          visitNoteLength: params.visitNoteLength,
          categoriesChecked: params.categoriesChecked,
          overallStatus: params.overallStatus,
        }),
        chunksUsed: params.categoriesChecked?.length ?? 0,
        responseCode: params.responseCode,
        responseTime: params.responseTime,
        errorMessage: params.errorMessage,
      },
    })
  } catch (error) {
    console.error('[audit] Failed to log compliance request:', error)
  }
}
