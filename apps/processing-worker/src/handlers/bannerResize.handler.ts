import type { BannerUploadedMessage } from '@eventflow/shared/types'

import type { WorkerContext } from '@/context'

/**
 * BANNER_UPLOADED → download the original from S3, generate BANNER_VARIANTS (webp),
 * upload them under OUTPUT.bannerPrefix, save `events.banner_variants`, invalidate
 * CACHE_SCOPE.catalog and log EVENT UPDATE. Idempotent: overwriting variants is safe.
 */
export async function handleBannerUploaded(
  message: BannerUploadedMessage,
  { logger }: WorkerContext,
) {
  logger.warn(
    { eventId: message.eventId, key: message.key },
    'BANNER_UPLOADED received — banner resize not implemented yet',
  )
}
