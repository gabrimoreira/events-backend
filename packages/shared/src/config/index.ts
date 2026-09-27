import { z } from 'zod'

/**
 * Building blocks for each service's `config/env.ts`. A service composes the
 * groups it needs, e.g. `z.object({ ...baseEnv.shape, ...databaseEnv.shape })`,
 * and parses them once with `parseEnv` — nothing else reads `process.env`.
 */
export const baseEnv = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
})

export const httpEnv = z.object({
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must have at least 16 characters'),
  JWT_TTL_HOURS: z.coerce.number().int().positive().default(168),
})

export const databaseEnv = z.object({
  DATABASE_URL: z.string().min(1),
})

export const redisEnv = z.object({
  REDIS_URL: z.string().default('redis://localhost:6379'),
})

export const awsEnv = z.object({
  AWS_REGION: z.string().default('us-east-1'),
  /** LocalStack endpoint; unset on AWS. */
  AWS_ENDPOINT_URL: z.url().optional(),
})

export const storageEnv = z.object({
  S3_BUCKET: z.string().min(1),
  S3_PUBLIC_URL: z.url(),
})

export const auditEnv = z.object({
  AUDIT_TABLE: z.string().default('eventflow-audit-log'),
  AUDIT_LOG_READS: z.stringbool().default(false),
})

export const messagingEnv = z.object({
  EVENTS_TOPIC_ARN: z.string().min(1),
})

/** Validates the environment and fails fast with every problem listed. Empty values count as unset. */
export function parseEnv<T extends z.ZodType>(schema: T, source: NodeJS.ProcessEnv = process.env) {
  const defined = Object.fromEntries(Object.entries(source).filter(([, value]) => value !== ''))
  const result = schema.safeParse(defined)
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n')
    throw new Error(`Invalid environment variables:\n${details}`)
  }
  return result.data
}

/** "a, b" → ["a", "b"] */
export function splitList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}
