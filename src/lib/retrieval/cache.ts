import crypto from 'crypto'
import { redis } from '../redis'
import type { QuerySource } from '../schemas/query'

const CACHE_PREFIX = 'query:'
const CACHE_TTL = 3600 // 1 hour in seconds

interface CachedResponse {
  answer: string
  sources: QuerySource[]
}

/**
 * Generates a cache key from the query string using SHA-256 hash.
 */
export function getCacheKey(query: string): string {
  const hash = crypto.createHash('sha256').update(query.trim().toLowerCase()).digest('hex')
  return `${CACHE_PREFIX}${hash}`
}

/**
 * Retrieves a cached response for the given query.
 * @returns The cached response or null if not found
 */
export async function getCachedResponse(
  query: string
): Promise<CachedResponse | null> {
  const key = getCacheKey(query)

  try {
    const cached = await redis.get<string>(key)
    if (!cached) {
      return null
    }

    // Parse the cached JSON string
    const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached
    return parsed as CachedResponse
  } catch {
    // If cache read fails, return null (fail-open)
    return null
  }
}

/**
 * Caches a response with 1 hour TTL.
 */
export async function cacheResponse(
  query: string,
  response: CachedResponse
): Promise<void> {
  const key = getCacheKey(query)

  try {
    await redis.set(key, JSON.stringify(response), { ex: CACHE_TTL })
  } catch {
    // If cache write fails, continue silently (fail-open)
    console.warn('[cache] Failed to cache response')
  }
}
