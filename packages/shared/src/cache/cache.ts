import type { Logger } from '../utils'

import type { Redis } from './redis'

/**
 * Cache scopes shared across services — a purchase (sales-service) must
 * invalidate what catalog-service cached, so the names live here.
 */
export const CACHE_SCOPE = {
  catalog: 'catalog',
  dashboard: 'dashboard',
} as const

export type CacheScope = (typeof CACHE_SCOPE)[keyof typeof CACHE_SCOPE]

/**
 * Cache-aside over Redis (ElastiCache). Keys are versioned per scope, so a single
 * `invalidate(scope)` drops every list/detail at once; stale versions expire by TTL.
 * Redis failures never break a request — the loader result is served instead.
 */
export function createCache(redis: Redis, logger: Logger) {
  const versionKey = (scope: CacheScope) => `${scope}:version`

  return {
    async remember<T>(
      scope: CacheScope,
      key: string,
      ttlSeconds: number,
      loader: () => Promise<T>,
    ): Promise<T> {
      let cacheKey: string | null = null
      try {
        const version = (await redis.get(versionKey(scope))) ?? '0'
        cacheKey = `${scope}:v${version}:${key}`
        const hit = await redis.get(cacheKey)
        if (hit !== null) return JSON.parse(hit) as T
      } catch (error) {
        logger.warn({ err: error, scope, key }, 'cache read failed')
      }

      const value = await loader()
      if (cacheKey) {
        redis
          .set(cacheKey, JSON.stringify(value), 'EX', ttlSeconds)
          .catch((error: unknown) =>
            logger.warn({ err: error, key: cacheKey }, 'cache write failed'),
          )
      }
      return value
    },

    async invalidate(scope: CacheScope): Promise<void> {
      try {
        await redis.incr(versionKey(scope))
      } catch (error) {
        logger.warn({ err: error, scope }, 'cache invalidation failed')
      }
    },
  }
}

export type Cache = ReturnType<typeof createCache>
