import { randomUUID } from 'node:crypto'

import { type DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'

import type { Logger } from '../utils'

export type AuditAction = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE'

export type AuditEntity = 'USER' | 'EVENT' | 'ORDER' | 'TICKET'

export interface AuditEntry {
  action: AuditAction
  entity: AuditEntity
  entityId: string
  actorId?: string
  data?: unknown
}

interface AuditLoggerOptions {
  client: DynamoDBDocumentClient
  tableName: string
  service: string
  logger: Logger
  logReads?: boolean
}

const MAX_STRING_LENGTH = 2_048
const SENSITIVE_KEY = /password|token|secret/i

function sanitize(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.length > MAX_STRING_LENGTH
      ? `${value.slice(0, 64)}… [${value.length} chars omitted]`
      : value
  }
  if (Array.isArray(value)) return value.map(sanitize)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        SENSITIVE_KEY.test(key) ? '[redacted]' : sanitize(item),
      ]),
    )
  }
  return value
}

export function createAuditLogger({
  client,
  tableName,
  service,
  logger,
  logReads = false,
}: AuditLoggerOptions) {
  return {
    async log(entry: AuditEntry): Promise<void> {
      if (entry.action === 'READ' && !logReads) return
      const timestamp = new Date().toISOString()
      const data =
        entry.data === undefined ? undefined : sanitize(JSON.parse(JSON.stringify(entry.data)))
      try {
        await client.send(
          new PutCommand({
            TableName: tableName,
            Item: {
              pk: `${entry.entity}#${entry.entityId}`,
              sk: `${timestamp}#${randomUUID()}`,
              action: entry.action,
              entity: entry.entity,
              entityId: entry.entityId,
              actorId: entry.actorId ?? 'system',
              service,
              data,
              timestamp,
            },
          }),
        )
      } catch (error) {
        logger.error({ err: error, audit: { ...entry, data: undefined } }, 'audit log write failed')
      }
    },
  }
}

export type AuditLogger = ReturnType<typeof createAuditLogger>
