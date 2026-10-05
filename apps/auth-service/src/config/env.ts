import {
  auditEnv,
  awsEnv,
  baseEnv,
  databaseEnv,
  httpEnv,
  parseEnv,
  redisEnv,
  splitList,
} from '@eventflow/shared/config'
import { z } from 'zod'

const raw = parseEnv(
  z.object({
    ...baseEnv.shape,
    ...httpEnv.shape,
    ...databaseEnv.shape,
    ...redisEnv.shape,
    ...awsEnv.shape,
    ...auditEnv.shape,
    PORT: z.coerce.number().int().positive().default(3001),
  }),
)

export const env = {
  port: raw.PORT,
  isDev: raw.NODE_ENV === 'development',
  logLevel: raw.LOG_LEVEL,
  corsOrigins: splitList(raw.CORS_ORIGIN),
  jwtSecret: raw.JWT_SECRET,
  jwtTtlHours: raw.JWT_TTL_HOURS,
  databaseUrl: raw.DATABASE_URL,
  redisUrl: raw.REDIS_URL,
  aws: { region: raw.AWS_REGION, endpoint: raw.AWS_ENDPOINT_URL },
  auditTable: raw.AUDIT_TABLE,
  auditLogReads: raw.AUDIT_LOG_READS,
} as const
