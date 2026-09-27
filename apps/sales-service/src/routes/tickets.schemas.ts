import { query } from '@eventflow/shared/http'
import { z } from 'zod'

/** GET /me/tickets */
export const ticketScopeSchema = z.object({
  scope: z.enum(['upcoming', 'past']).optional(),
})

/** GET /tickets (admin) — mirrors AdminTicketQuery. */
export const adminTicketQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(['processing', 'valid', 'used', 'cancelled', 'all']).optional(),
  eventId: z.string().optional(),
  page: query.page,
  pageSize: query.pageSize,
})
