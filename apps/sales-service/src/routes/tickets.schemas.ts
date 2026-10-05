import { query } from '@eventflow/shared/http'
import { z } from 'zod'

export const ticketScopeSchema = z.object({
  scope: z.enum(['upcoming', 'past']).optional(),
})

export const adminTicketQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(['processing', 'valid', 'used', 'cancelled', 'all']).optional(),
  eventId: z.string().optional(),
  page: query.page,
  pageSize: query.pageSize,
})
