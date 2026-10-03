import type { S3Client } from '@aws-sdk/client-s3'
import type { AuditLogger } from '@eventflow/shared/audit'
import { CACHE_SCOPE, type Cache } from '@eventflow/shared/cache'
import { ApiError, notImplemented, type AuthUser } from '@eventflow/shared/http'
import type { Publisher } from '@eventflow/shared/messaging'
import type { DbClient, Prisma } from '@eventflow/db'

import type { EventsService } from './contracts'
import type { Event, EventInput, EventQuery, Paginated } from '@eventflow/shared/types'
import { toEvent } from '@/utils/mappers'

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
      return notImplemented()
    },
    async updateEvent(id: string, input: EventInput, actor: AuthUser): Promise<Event> {

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
      const deleted = await _deps.db.event.delete({
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
