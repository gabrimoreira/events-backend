import {
  auditEnv,
  awsEnv,
  baseEnv,
  databaseEnv,
  parseEnv,
  redisEnv,
  storageEnv,
} from '@eventflow/shared/config'
import { z } from 'zod'

const raw = parseEnv(
  z.object({
    ...baseEnv.shape,
    ...databaseEnv.shape,
    ...redisEnv.shape,
    ...awsEnv.shape,
    ...storageEnv.shape,
    ...auditEnv.shape,
    TICKET_JOBS_QUEUE: z.string().default('eventflow-ticket-jobs'),
    IMAGE_JOBS_QUEUE: z.string().default('eventflow-image-jobs'),
  }),
)

/**
 * Centralized, typed access to environment variables.
 * Never read `process.env` directly outside this file.
 */
export const env = {
  isDev: raw.NODE_ENV === 'development',
  logLevel: raw.LOG_LEVEL,
  databaseUrl: raw.DATABASE_URL,
  redisUrl: raw.REDIS_URL,
  aws: { region: raw.AWS_REGION, endpoint: raw.AWS_ENDPOINT_URL },
  s3Bucket: raw.S3_BUCKET,
  s3PublicUrl: raw.S3_PUBLIC_URL,
  auditTable: raw.AUDIT_TABLE,
  queues: {
    ticketJobs: raw.TICKET_JOBS_QUEUE,
    imageJobs: raw.IMAGE_JOBS_QUEUE,
  },
} as const
