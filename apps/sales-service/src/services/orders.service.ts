import type { AuditLogger } from '@eventflow/shared/audit'
import type { Cache } from '@eventflow/shared/cache'
import { notImplemented } from '@eventflow/shared/http'
import type { Publisher } from '@eventflow/shared/messaging'
import type { DbClient } from '@eventflow/db'

import type { OrdersService } from './contracts'

export interface OrdersServiceDeps {
  db: DbClient
  cache: Cache
  audit: AuditLogger
  publisher: Publisher
}

/**
 * Orders and the purchase flow. `createPurchase` runs in ONE database transaction:
 *   UPDATE ticket_batches SET sold = sold + $q
 *    WHERE id = $id AND sold + $q <= quantity AND now() BETWEEN starts_at AND ends_at
 * 0 rows → rollback + 409 (SOLD_OUT / BATCH_UNAVAILABLE); SALES_CLOSED when the event
 * is not published or already over; 422 above MAX_TICKETS_PER_ORDER. Then insert the
 * order, its items and the tickets as `processing`. After the commit: invalidate the
 * catalog cache, log ORDER CREATE and publish ORDER_PAID (the worker issues the PDFs).
 *
 * Dependencies are already wired — rename `_deps` when implementing.
 */
export function createOrdersService(_deps: OrdersServiceDeps): OrdersService {
  return {
    async getOrders() {
      return notImplemented()
    },
    async getOrderById() {
      return notImplemented()
    },
    async createPurchase() {
      return notImplemented()
    },
  }
}
