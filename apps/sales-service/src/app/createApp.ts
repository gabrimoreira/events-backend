import {
  commonMiddlewares,
  errorHandler,
  healthRouter,
  notFoundHandler,
} from '@eventflow/shared/http'
import express from 'express'

import { env } from '@/config/env'
import { SERVICE_NAME } from '@/constants'
import { dashboardRoutes } from '@/routes/dashboard.routes'
import { ordersRoutes } from '@/routes/orders.routes'
import { ticketsRoutes } from '@/routes/tickets.routes'
import { createDashboardService } from '@/services/dashboard.service'
import { createOrdersService } from '@/services/orders.service'
import { createTicketsService } from '@/services/tickets.service'

import type { AppContext } from './context'

export function createApp(context: AppContext) {
  const { logger, db, redis, cache, denylist, s3, audit, publisher } = context
  const auth = { secret: env.jwtSecret, isRevoked: denylist.isRevoked }

  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', true)

  app.use(commonMiddlewares({ logger, corsOrigins: env.corsOrigins }))
  app.use(
    healthRouter(SERVICE_NAME, {
      database: () => db.$queryRaw`SELECT 1`,
      redis: () => redis.ping(),
    }),
  )
  app.use('/api', ordersRoutes(createOrdersService({ db, cache, audit, publisher, logger }), auth))
  app.use('/api', ticketsRoutes(createTicketsService({ db, s3, audit }), auth))
  app.use('/api', dashboardRoutes(createDashboardService({ db, cache }), auth))
  app.use(notFoundHandler)
  app.use(errorHandler(logger))

  return app
}
