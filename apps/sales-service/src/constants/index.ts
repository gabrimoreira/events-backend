export const SERVICE_NAME = 'sales-service'

export const DEFAULT_PAGE_SIZE = 10

export const MAX_TICKETS_PER_ORDER = 10
export const SERVICE_FEE_RATE = 0.1

export const UPCOMING_GRACE_MS = 12 * 3_600_000

export const CACHE_TTL = {
  dashboard: 30,
} as const

export const TICKET_PDF = {
  keyPrefix: 'private/tickets',
  urlTtlSeconds: 300,
} as const
