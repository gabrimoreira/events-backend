export const SERVICE_NAME = 'sales-service'

export const DEFAULT_PAGE_SIZE = 10

/** Same rules as the frontend (mockServices.ts / utils/pricing.ts) — the backend is the source of truth. */
export const MAX_TICKETS_PER_ORDER = 10
export const SERVICE_FEE_RATE = 0.1

/** A ticket stays in "upcoming" until 12 h after the event starts. */
export const UPCOMING_GRACE_MS = 12 * 3_600_000

/** Cache TTLs in seconds (ElastiCache). */
export const CACHE_TTL = {
  dashboard: 30,
} as const

/** Ticket PDFs are private in S3; the API hands out short-lived pre-signed URLs. */
export const TICKET_PDF = {
  keyPrefix: 'private/tickets',
  urlTtlSeconds: 300,
} as const
