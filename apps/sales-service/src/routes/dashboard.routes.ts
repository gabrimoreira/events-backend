import { type AuthOptions, requireAdmin, requireAuth } from '@eventflow/shared/http'
import { Router } from 'express'

import type { DashboardService } from '@/services/contracts'

/** Endpoint from events-frontend/src/services/api/httpServices.ts (dashboardHttpService). */
export function dashboardRoutes(service: DashboardService, auth: AuthOptions): Router {
  const router = Router()

  router.get('/admin/dashboard', requireAuth(auth), requireAdmin, async (_req, res) => {
    res.json(await service.getDashboardStats())
  })

  return router
}
