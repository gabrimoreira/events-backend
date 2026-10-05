import { createAuditLogger } from '@eventflow/shared/audit'
import { createDynamoClient } from '@eventflow/shared/aws'
import { createRedis, createTokenDenylist } from '@eventflow/shared/cache'
import { createLogger } from '@eventflow/shared/utils'
import { createDbClient } from '@eventflow/db'

import { env } from '@/config/env'
import { SERVICE_NAME } from '@/constants'

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
  return { logger, db, redis, audit, denylist: createTokenDenylist(redis) }
}

export type AppContext = ReturnType<typeof createContext>
