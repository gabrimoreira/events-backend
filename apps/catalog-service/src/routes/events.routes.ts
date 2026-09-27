import {
  type AuthOptions,
  currentUser,
  optionalAuth,
  parseWith,
  requireAdmin,
  requireAuth,
  routeParam,
} from '@eventflow/shared/http'
import { Router } from 'express'

import type { EventsService } from '@/services/contracts'

import { eventInputSchema, eventQuerySchema } from './events.schemas'

/** Endpoints from events-frontend/src/services/api/httpServices.ts (eventsHttpService). */
export function eventsRoutes(service: EventsService, auth: AuthOptions): Router {
  const router = Router()
  const admin = [requireAuth(auth), requireAdmin]
  const viewer = optionalAuth(auth)

  router.get('/events', viewer, async (req, res) => {
    res.json(await service.getEvents(parseWith(eventQuerySchema, req.query), req.user))
  })

  // Before /events/:id so "cities" is not taken as an id.
  router.get('/events/cities', async (_req, res) => {
    res.json(await service.getEventCities())
  })

  router.get('/events/:id', viewer, async (req, res) => {
    res.json(await service.getEventById(routeParam(req, 'id'), req.user))
  })

  router.post('/events', ...admin, async (req, res) => {
    const input = parseWith(eventInputSchema, req.body)
    res.status(201).json(await service.createEvent(input, currentUser(req)))
  })

  router.put('/events/:id', ...admin, async (req, res) => {
    const input = parseWith(eventInputSchema, req.body)
    res.json(await service.updateEvent(routeParam(req, 'id'), input, currentUser(req)))
  })

  router.delete('/events/:id', ...admin, async (req, res) => {
    await service.deleteEvent(routeParam(req, 'id'), currentUser(req))
    res.status(204).end()
  })

  return router
}
