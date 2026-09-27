import { createAuditLogger } from '@eventflow/shared/audit'
import { createDynamoClient, createS3Client, createSnsClient } from '@eventflow/shared/aws'
import { createCache, createRedis, createTokenDenylist } from '@eventflow/shared/cache'
import { createPublisher } from '@eventflow/shared/messaging'
import { createLogger } from '@eventflow/shared/utils'
import { createDbClient } from '@eventflow/db'

import { env } from '@/config/env'
import { SERVICE_NAME } from '@/constants'

/** Infrastructure clients, created once per process and shared by routes and services. */
export function createContext() {
  const logger = createLogger(SERVICE_NAME, { level: env.logLevel, pretty: env.isDev })
  const db = createDbClient(env.databaseUrl)
  const redis = createRedis(env.redisUrl, logger)
  const audit = createAuditLogger({
    client: createDynamoClient(env.aws),
    tableName: env.auditTable,
    service: SERVICE_NAME,
    logger,
    logReads: env.auditLogReads,
  })
  const publisher = createPublisher({
    client: createSnsClient(env.aws),
    topicArn: env.eventsTopicArn,
    logger,
  })
  return {
    logger,
    db,
    redis,
    cache: createCache(redis, logger),
    denylist: createTokenDenylist(redis),
    s3: createS3Client(env.aws),
    audit,
    publisher,
  }
}

export type AppContext = ReturnType<typeof createContext>
