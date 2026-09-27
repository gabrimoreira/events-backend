import type { S3Client } from '@aws-sdk/client-s3'
import type { AuditLogger } from '@eventflow/shared/audit'
import { notImplemented } from '@eventflow/shared/http'
import type { DbClient } from '@eventflow/db'

import type { TicketsService } from './contracts'

export interface TicketsServiceDeps {
  db: DbClient
  s3: S3Client
  audit: AuditLogger
}

/**
 * Issued tickets. `scope` splits upcoming/past with UPCOMING_GRACE_MS (same rule as
 * the mocks); `TICKET_NOT_FOUND` 404 when the ticket is not the actor's (unless admin).
 * `pdfUrl` is a pre-signed S3 URL (TICKET_PDF) — tickets stay `processing` until the worker
 * uploads the PDF, and the frontend polls meanwhile.
 *
 * Dependencies are already wired — rename `_deps` when implementing.
 */
export function createTicketsService(_deps: TicketsServiceDeps): TicketsService {
  return {
    async getTickets() {
      return notImplemented()
    },
    async getTicketById() {
      return notImplemented()
    },
    async getAllTickets() {
      return notImplemented()
    },
  }
}
