export const SERVICE_NAME = 'catalog-service'

export const DEFAULT_PAGE_SIZE = 12

export const CACHE_TTL = {
  list: 60,
  detail: 300,
  cities: 600,
} as const

export const BANNER = {
  maxBytes: 2 * 1024 * 1024,
  mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  keyPrefix: 'public/banners',
} as const
