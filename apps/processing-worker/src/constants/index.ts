export const SERVICE_NAME = 'processing-worker'

export const OUTPUT = {
  ticketPdfPrefix: 'private/tickets',
  bannerPrefix: 'public/banners',
} as const

export const BANNER_VARIANTS = {
  thumb: 400,
  card: 800,
  hero: 1600,
} as const
