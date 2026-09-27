import { Redis } from 'ioredis'

import type { Logger } from '../utils'

export type { Redis }

export function createRedis(url: string, logger: Logger): Redis {
  // Fail fast: callers fall back to the database instead of queueing retries.
  const redis = new Redis(url, { maxRetriesPerRequest: 1 })
  redis.on('error', (error) => logger.warn({ err: error }, 'redis error'))
  return redis
}
