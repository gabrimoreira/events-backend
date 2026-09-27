import type { Cache } from '@eventflow/shared/cache'
import { notImplemented } from '@eventflow/shared/http'
import type { DbClient } from '@eventflow/db'

import type { DashboardService } from './contracts'

export interface DashboardServiceDeps {
  db: DbClient
  cache: Cache
}

/**
 * Admin KPIs (DashboardStats): active events, tickets sold, revenue, orders,
 * sales of the last 7 days, top events and category distribution — aggregated in SQL
 * and cached for CACHE_TTL.dashboard seconds (CACHE_SCOPE.dashboard).
 *
 * Dependencies are already wired — rename `_deps` when implementing.
 */
export function createDashboardService(_deps: DashboardServiceDeps): DashboardService {
  return {
    async getDashboardStats() {
      return notImplemented()
    },
  }
}
