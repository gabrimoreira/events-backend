export const SERVICE_NAME = 'catalog-service'

/** Default page size of the public listing (the frontend grid shows 12). */
export const DEFAULT_PAGE_SIZE = 12

/** Cache TTLs in seconds (ElastiCache). Writes also invalidate the whole catalog scope. */
export const CACHE_TTL = {
  list: 60,
  detail: 300,
  cities: 600,
} as const

/** Banner uploads, same limits as the frontend BannerUpload component. */
export const BANNER = {
  maxBytes: 2 * 1024 * 1024,
  mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  /** S3 prefix readable by the browser (bucket policy). */
  keyPrefix: 'public/banners',
} as const
