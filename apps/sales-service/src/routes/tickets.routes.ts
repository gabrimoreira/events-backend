import {
  type AuthOptions,
  currentUser,
  parseWith,
  requireAdmin,
  requireAuth,
  routeParam,
} from '@eventflow/shared/http'
import { Router } from 'express'

import type { TicketsService } from '@/services/contracts'

import { adminTicketQuerySchema, ticketScopeSchema } from './tickets.schemas'

/** Endpoints from events-frontend/src/services/api/httpServices.ts (ticketsHttpService). */
export function ticketsRoutes(service: TicketsService, auth: AuthOptions): Router {
  const router = Router()
  const authenticated = requireAuth(auth)

  router.get('/me/tickets', authenticated, async (req, res) => {
    const { scope } = parseWith(ticketScopeSchema, req.query)
    res.json(await service.getTickets(currentUser(req), scope))
  })

  router.get('/me/tickets/:id', authenticated, async (req, res) => {
    res.json(await service.getTicketById(routeParam(req, 'id'), currentUser(req)))
  })

  router.get('/tickets', authenticated, requireAdmin, async (req, res) => {
    res.json(await service.getAllTickets(parseWith(adminTicketQuerySchema, req.query)))
  })

  return router
}
