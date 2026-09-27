import {
  auditEnv,
  awsEnv,
  baseEnv,
  databaseEnv,
  httpEnv,
  messagingEnv,
  parseEnv,
  redisEnv,
  splitList,
  storageEnv,
} from '@eventflow/shared/config'
import { z } from 'zod'

const raw = parseEnv(
  z.object({
    ...baseEnv.shape,
    ...httpEnv.shape,
    ...databaseEnv.shape,
    ...redisEnv.shape,
    ...awsEnv.shape,
    ...storageEnv.shape,
    ...auditEnv.shape,
    ...messagingEnv.shape,
    PORT: z.coerce.number().int().positive().default(3003),
  }),
)

/**
 * Centralized, typed access to environment variables.
 * Never read `process.env` directly outside this file.
 */
export const env = {
  port: raw.PORT,
  isDev: raw.NODE_ENV === 'development',
  logLevel: raw.LOG_LEVEL,
  corsOrigins: splitList(raw.CORS_ORIGIN),
  jwtSecret: raw.JWT_SECRET,
  databaseUrl: raw.DATABASE_URL,
  redisUrl: raw.REDIS_URL,
  aws: { region: raw.AWS_REGION, endpoint: raw.AWS_ENDPOINT_URL },
  s3Bucket: raw.S3_BUCKET,
  s3PublicUrl: raw.S3_PUBLIC_URL,
  auditTable: raw.AUDIT_TABLE,
  auditLogReads: raw.AUDIT_LOG_READS,
  eventsTopicArn: raw.EVENTS_TOPIC_ARN,
} as const
