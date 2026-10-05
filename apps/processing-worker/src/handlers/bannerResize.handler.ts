import { posix } from 'node:path'

import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { CACHE_SCOPE } from '@eventflow/shared/cache'
import type { BannerUploadedMessage } from '@eventflow/shared/types'
import sharp from 'sharp'

import { env } from '@/config/env'
import { BANNER_VARIANTS, OUTPUT } from '@/constants'
import type { WorkerContext } from '@/context'

type VariantName = keyof typeof BANNER_VARIANTS

export async function handleBannerUploaded(
  message: BannerUploadedMessage,
  { db, s3, cache, audit, logger }: WorkerContext,
) {
  const originalUrl = `${env.s3PublicUrl}/${message.key}`
  const event = await db.event.findUnique({
    where: { id: message.eventId },
    select: { bannerUrl: true },
  })
  if (!event || event.bannerUrl !== originalUrl) {
    logger.info(
      { eventId: message.eventId, key: message.key },
      'BANNER_UPLOADED: event deleted or banner replaced, skipping',
    )
    return
  }

  const { Body } = await s3.send(new GetObjectCommand({ Bucket: env.s3Bucket, Key: message.key }))
  if (!Body) throw new Error(`Empty S3 object: ${message.key}`)
  const original = Buffer.from(await Body.transformToByteArray())

  const baseName = posix.basename(message.key, posix.extname(message.key))
  const variants = {} as Record<VariantName, string>
  const sizes: Record<string, number> = {}

  for (const [name, width] of Object.entries(BANNER_VARIANTS) as [VariantName, number][]) {
    const resized = await sharp(original)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer()
    const key = `${OUTPUT.bannerPrefix}/variants/${baseName}-${name}.webp`
    await s3.send(
      new PutObjectCommand({
        Bucket: env.s3Bucket,
        Key: key,
        Body: resized,
        ContentType: 'image/webp',
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    )
    variants[name] = `${env.s3PublicUrl}/${key}`
    sizes[name] = resized.length
  }

  const { count } = await db.event.updateMany({
    where: { id: message.eventId, bannerUrl: originalUrl },
    data: { bannerVariants: variants },
  })
  if (count === 0) return

  await cache.invalidate(CACHE_SCOPE.catalog)
  await audit.log({
    action: 'UPDATE',
    entity: 'EVENT',
    entityId: message.eventId,
    data: { bannerVariants: variants, originalBytes: original.length, variantBytes: sizes },
  })
  logger.info({ eventId: message.eventId, variants: Object.keys(variants) }, 'banner resized')
}
