import { randomUUID } from 'node:crypto'
import { Buffer } from 'node:buffer'
import { PutObjectCommand, type S3Client } from '@aws-sdk/client-s3'
import type { AuditLogger } from '@eventflow/shared/audit'
import { CACHE_SCOPE, type Cache } from '@eventflow/shared/cache'
import { ApiError, type AuthUser } from '@eventflow/shared/http'
import type { Publisher } from '@eventflow/shared/messaging'
import type { DbClient, Prisma } from '@eventflow/db'

import type { EventsService } from './contracts'
import type { Event, EventInput, EventQuery, Paginated } from '@eventflow/shared/types'
import { toEvent } from '@/utils/mappers'
import { env } from '@/config/env'
import { BANNER } from '@/constants'

export interface EventsServiceDeps {
  db: DbClient
  cache: Cache
  s3: S3Client
  audit: AuditLogger
  publisher: Publisher
}

const eventInclude = {
  batches: { orderBy: { position: 'asc' as const } },
}

/**
 * Event catalog. Rules to port from events-frontend/src/services/mocks/mockServices.ts:
 * filters/sorting/pagination of the listing, published-only for the public,
 * `EVENT_NOT_FOUND` 404. Reads go through `cache.remember(CACHE_SCOPE.catalog, …)`;
 * writes call `cache.invalidate`, log `EVENT` actions and, when `bannerUrl` is a
 * data URL, upload it to S3 (BANNER.keyPrefix) and publish `BANNER_UPLOADED`.
 *
 * Dependencies are already wired — rename `_deps` when implementing.
 */
export function createEventsService(_deps: EventsServiceDeps): EventsService {
  return {
    async getEvents(query: EventQuery, actor?: AuthUser): Promise<Paginated<Event>> {
      const cacheKey = `list:${JSON.stringify(query)}:role_${actor?.role ?? 'guest'}`

      return _deps.cache.remember(
        CACHE_SCOPE.catalog,
        cacheKey,
        60,
        async () => {
          const { page = 1, pageSize = 12 } = query
          const skip = (page - 1) * pageSize

          const where = buildWhereClause(query, actor)
          const orderBy = buildOrderByClause(query.sort)

          const [total, events] = await _deps.db.$transaction([
            _deps.db.event.count({ where }),
            _deps.db.event.findMany({
              where,
              orderBy,
              skip,
              take: pageSize,
              include: eventInclude
            })
          ])

          return {
            items: events.map(toEvent),
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize)
          }
        }
      )
    },
    async getEventById(id: string, actor?: AuthUser): Promise<Event> {
      const cacheKey = `detail:${id}:role_${actor?.role ?? 'guest'}`

      return _deps.cache.remember(
        CACHE_SCOPE.catalog,
        cacheKey,
        60,
        async () => {
          const event = await _deps.db.event.findUnique({
            where: { id },
            include: eventInclude
          })
          if (!event || (actor?.role !== "admin" && event.status !== "published")) {
            throw new ApiError("Evento não encontrado", 404, "EVENT_NOT_FOUND")
          }
          return toEvent(event)
        }
      )
    },
    async getEventCities(): Promise<string[]> {
      return _deps.cache.remember(
        CACHE_SCOPE.catalog,
        'cities',
        300,
        async () => {
          const events = await _deps.db.event.findMany({
            where: { status: 'published' },
            select: { venueCity: true },
            distinct: ['venueCity'],
            orderBy: { venueCity: 'asc' }
          })
          return events.map((e) => e.venueCity)
        }
      )
    },
    async createEvent(input: EventInput, actor: AuthUser): Promise<Event> {
      if (actor?.role !== 'admin') {
        throw new ApiError('Unauthorized', 403, 'UNAUTHORIZED')
      }

      const { bannerUrl, bannerKey } = await handleBannerUpload(input.bannerUrl, _deps.s3)

      const event = await _deps.db.event.create({
        data: {
          id: randomUUID(),
          title: input.title,
          summary: input.summary,
          description: input.description,
          category: input.category,
          venueCity: input.venue.city,
          venueAddress: input.venue.address,
          venueName: input.venue.name,
          venueState: input.venue.state,
          organizerName: actor.name,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          bannerUrl: bannerUrl,
          status: input.status,
          featured: input.featured,
          tags: [],
          batches: {
            create: input.batches.map((batch, index) => ({
              id: batch.id ?? randomUUID(),
              name: batch.name,
              price: batch.price,
              quantity: batch.quantity,
              startsAt: batch.startsAt,
              endsAt: batch.endsAt,
              position: index
            }))
          }
        },
        include: eventInclude,
      })

      await _deps.audit.log({
        action: 'CREATE',
        entity: 'EVENT',
        entityId: event.id,
        data: {
          title: event.title
        }
      })

      if (bannerKey) {
        await _deps.publisher.publish({
          type: 'BANNER_UPLOADED',
          eventId: event.id,
          key: bannerKey,
          occurredAt: new Date().toISOString()
        })
      }

      await _deps.cache.invalidate(CACHE_SCOPE.catalog)

      return toEvent(event)
    },

    async updateEvent(id: string, input: EventInput, actor: AuthUser): Promise<Event> {
      const event = await _deps.db.event.findUnique({
        where: { id: id }
      })
      if (!event) {
        throw new ApiError("Evento não encontrado", 404, "EVENT_NOT_FOUND")
      }
      if (actor?.role !== 'admin') {
        throw new ApiError("Unauthorized", 403, "UNAUTHORIZED")
      }

      const { bannerUrl, bannerKey } = await handleBannerUpload(input.bannerUrl, _deps.s3)

      const updateEvent = await _deps.db.event.update({
        where: { id: id },
        data: {
          title: input.title,
          summary: input.summary,
          description: input.description,
          category: input.category,
          venueName: input.venue.name,
          venueCity: input.venue.city,
          venueState: input.venue.state,
          venueAddress: input.venue.address,
          organizerName: event.organizerName,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          status: input.status,
          featured: input.featured,
          tags: event.tags,
          bannerUrl: bannerUrl,
        },
        include: eventInclude
      })

      await _deps.audit.log({
        action: 'UPDATE',
        entity: 'EVENT',
        entityId: updateEvent.id,
        data: {
          title: updateEvent.title
        }
      })

      if (bannerKey) {
        await _deps.publisher.publish({
          type: 'BANNER_UPLOADED',
          eventId: updateEvent.id,
          key: bannerKey,
          occurredAt: new Date().toISOString()
        })
      }

      await _deps.cache.invalidate(CACHE_SCOPE.catalog)

      return toEvent(updateEvent);

    },
    async deleteEvent(id: string, actor: AuthUser): Promise<void> {
      const event = await _deps.db.event.findUnique({
        where: { id: id },
      })
      if (!event) {
        throw new ApiError('Evento não encontrado', 404, 'EVENT_NOT_FOUND')
      }
      if (actor?.role !== 'admin') {
        throw new ApiError('Unauthorized', 403, 'UNAUTHORIZED')
      }
      await _deps.db.event.delete({
        where: { id: id },
      })
      await _deps.audit.log({
        action: 'DELETE',
        entity: 'EVENT',
        entityId: event.id,
        data: {
          title: event.title
        }
      })
      await _deps.cache.invalidate(CACHE_SCOPE.catalog)
    },
  }
}

async function handleBannerUpload(bannerInput: string, s3: S3Client): Promise<{ bannerUrl: string; bannerKey?: string }> {
  if (!bannerInput.startsWith('data:')) {
    return { bannerUrl: bannerInput }
  }

  const match = bannerInput.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/)
  if (!match) {
    throw new ApiError('Formato de imagem inválido', 400, 'INVALID_IMAGE')
  }

  const mimeType = match[1] as string
  const base64Data = match[2] as string
  const buffer = Buffer.from(base64Data, 'base64')
  const extension = mimeType.split('/')[1] || 'png'
  const key = `${BANNER.keyPrefix}/${randomUUID()}.${extension}`

  await s3.send(
    new PutObjectCommand({
      Bucket: env.s3Bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  )

  return {
    bannerUrl: `${env.s3PublicUrl}/${key}`,
    bannerKey: key,
  }
}

function buildWhereClause(query: EventQuery, actor?: AuthUser): Prisma.EventWhereInput {
  const { search, category, city, from, priceRange, status, featured } = query
  const where: Prisma.EventWhereInput = {}

  if (actor?.role !== 'admin') {
    where.status = 'published'
  } else if (status && status !== 'all') {
    where.status = status
  }

  if (category) {
    where.category = category
  }

  if (city) {
    where.venueCity = city
  }

  if (from) {
    where.startsAt = { gte: new Date(from) }
  }

  if (featured !== undefined) {
    where.featured = featured
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { summary: { contains: search, mode: 'insensitive' } },
      { venueName: { contains: search, mode: 'insensitive' } },
      { organizerName: { contains: search, mode: 'insensitive' } }
    ]
  }

  if (priceRange) {
    const priceFilters: Record<string, any> = {
      'free-50': { lte: 50 },
      '50-100': { gte: 50, lte: 100 },
      '100-200': { gte: 100, lte: 200 },
      '200-plus': { gte: 200 }
    }

    if (priceFilters[priceRange]) {
      where.batches = {
        some: {
          price: priceFilters[priceRange]
        }
      }
    }
  }

  return where
}

function buildOrderByClause(sort?: string): Prisma.EventOrderByWithRelationInput | Prisma.EventOrderByWithRelationInput[] {
  switch (sort) {
    case 'recent':
      return { createdAt: 'desc' }
    case 'date':
      return { startsAt: 'asc' }
    case 'price-asc':
    case 'price-desc':
      return { startsAt: 'asc' }
    case 'relevance':
      return [{ featured: 'desc' }, { startsAt: 'asc' }]
    default:
      return { startsAt: 'asc' }
  }
}
