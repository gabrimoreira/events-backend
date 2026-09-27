import { createAuditLogger } from '@eventflow/shared/audit'
import { createDynamoClient, createS3Client, createSqsClient } from '@eventflow/shared/aws'
import { createCache, createRedis } from '@eventflow/shared/cache'
import { createLogger } from '@eventflow/shared/utils'
import { createDbClient } from '@eventflow/db'

import { env } from '@/config/env'
import { SERVICE_NAME } from '@/constants'

/** Infrastructure clients, created once per process and shared by the handlers. */
export function createContext() {
  const logger = createLogger(SERVICE_NAME, { level: env.logLevel, pretty: env.isDev })
  const redis = createRedis(env.redisUrl, logger)
  return {
    logger,
    db: createDbClient(env.databaseUrl),
    redis,
    cache: createCache(redis, logger),
    s3: createS3Client(env.aws),
    sqs: createSqsClient(env.aws),
    audit: createAuditLogger({
      client: createDynamoClient(env.aws),
      tableName: env.auditTable,
      service: SERVICE_NAME,
      logger,
    }),
  }
}

export type WorkerContext = ReturnType<typeof createContext>
