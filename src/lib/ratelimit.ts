import { Ratelimit } from '@upstash/ratelimit'
import { redis } from './redis'

// Global rate limit: 100 requests per 60 seconds
export const globalRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '60 s'),
  prefix: '@compliance/global',
  analytics: true,
})

// Query API rate limit: 20 requests per 60 seconds
export const queryRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '60 s'),
  prefix: '@compliance/query',
  analytics: true,
})

// Compliance API rate limit: 10 requests per 60 seconds
export const complianceRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '60 s'),
  prefix: '@compliance/compliance',
  analytics: true,
})

// Helper to get the appropriate rate limiter for a path
export function getRateLimiter(pathname: string): Ratelimit {
  if (pathname.startsWith('/api/query')) {
    return queryRatelimit
  }
  if (pathname.startsWith('/api/compliance')) {
    return complianceRatelimit
  }
  return globalRatelimit
}

// Type for rate limit result
export type RateLimitResult = {
  success: boolean
  limit: number
  remaining: number
  reset: number
}
