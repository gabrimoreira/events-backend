import type { S3Client } from '@aws-sdk/client-s3'
import type { AuditLogger } from '@eventflow/shared/audit'
import type { Cache } from '@eventflow/shared/cache'
import { notImplemented } from '@eventflow/shared/http'
import type { Publisher } from '@eventflow/shared/messaging'
import type { DbClient } from '@eventflow/db'

import type { EventsService } from './contracts'

export interface EventsServiceDeps {
  db: DbClient
  cache: Cache
  s3: S3Client
  audit: AuditLogger
  publisher: Publisher
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
    async getEvents() {
      return notImplemented()
    },
    async getEventById() {
      return notImplemented()
    },
    async getEventCities() {
      return notImplemented()
    },
    async createEvent() {
      return notImplemented()
    },
    async updateEvent() {
      return notImplemented()
    },
    async deleteEvent() {
      return notImplemented()
    },
  }
}
