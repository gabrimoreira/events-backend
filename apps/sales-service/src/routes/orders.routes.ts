import {
  type AuthOptions,
  currentUser,
  parseWith,
  requireAdmin,
  requireAuth,
  routeParam,
} from '@eventflow/shared/http'
import { Router } from 'express'

import type { OrdersService } from '@/services/contracts'

import { orderQuerySchema, purchaseSchema } from './orders.schemas'

/** Endpoints from events-frontend/src/services/api/httpServices.ts (ordersHttpService). */
export function ordersRoutes(service: OrdersService, auth: AuthOptions): Router {
  const router = Router()
  const authenticated = requireAuth(auth)

  router.get('/orders', authenticated, requireAdmin, async (req, res) => {
    res.json(await service.getOrders(parseWith(orderQuerySchema, req.query)))
  })

  router.get('/orders/:id', authenticated, async (req, res) => {
    res.json(await service.getOrderById(routeParam(req, 'id'), currentUser(req)))
  })

  router.post('/orders', authenticated, async (req, res) => {
    const purchase = parseWith(purchaseSchema, req.body)
    res.status(201).json(await service.createPurchase(purchase, currentUser(req)))
  })

  return router
}
