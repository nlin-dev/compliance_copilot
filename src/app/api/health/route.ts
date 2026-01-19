import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type HealthStatus = {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  checks: {
    name: string
    status: 'pass' | 'fail'
    message?: string
  }[]
}

export async function GET(): Promise<NextResponse<HealthStatus>> {
  const checks: HealthStatus['checks'] = []

  // Check environment variables are configured
  const envChecks = [
    { name: 'OPENAI_API_KEY', key: 'OPENAI_API_KEY' },
    { name: 'PINECONE_API_KEY', key: 'PINECONE_API_KEY' },
    { name: 'PINECONE_INDEX', key: 'PINECONE_INDEX' },
    { name: 'UPSTASH_REDIS_REST_URL', key: 'UPSTASH_REDIS_REST_URL' },
    { name: 'DATABASE_URL', key: 'DATABASE_URL' },
  ]

  for (const { name, key } of envChecks) {
    const configured = !!process.env[key]
    checks.push({
      name: `env:${name}`,
      status: configured ? 'pass' : 'fail',
      message: configured ? 'Configured' : 'Not configured',
    })
  }

  // Determine overall status
  const failedChecks = checks.filter((c) => c.status === 'fail')
  let status: HealthStatus['status'] = 'healthy'

  if (failedChecks.length > 0) {
    // If critical services are missing, unhealthy
    const criticalMissing = failedChecks.some((c) =>
      ['env:OPENAI_API_KEY', 'env:PINECONE_API_KEY'].includes(c.name)
    )
    status = criticalMissing ? 'unhealthy' : 'degraded'
  }

  const response: HealthStatus = {
    status,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? '0.0.0',
    checks,
  }

  const httpStatus = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503

  return NextResponse.json(response, { status: httpStatus })
}
