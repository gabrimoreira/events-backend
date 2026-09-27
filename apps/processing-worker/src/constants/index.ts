export const SERVICE_NAME = 'processing-worker'

/** Where the worker writes generated files in S3. */
export const OUTPUT = {
  ticketPdfPrefix: 'private/tickets',
  bannerPrefix: 'public/banners',
} as const

/** Banner variants generated from each upload (width in px, webp). */
export const BANNER_VARIANTS = {
  thumb: 400,
  card: 800,
  hero: 1600,
} as const
