import {
  commonMiddlewares,
  errorHandler,
  healthRouter,
  notFoundHandler,
} from '@eventflow/shared/http'
import express from 'express'

import { env } from '@/config/env'
import { SERVICE_NAME } from '@/constants'
import { eventsRoutes } from '@/routes/events.routes'
import { createEventsService } from '@/services/events.service'

import type { AppContext } from './context'

export function createApp(context: AppContext) {
  const { logger, db, redis, cache, denylist, s3, audit, publisher } = context
  const auth = { secret: env.jwtSecret, isRevoked: denylist.isRevoked }

  const app = express()
  app.disable('x-powered-by')
  // Behind nginx and the ALB: trust X-Forwarded-* for client IPs.
  app.set('trust proxy', true)

  app.use(commonMiddlewares({ logger, corsOrigins: env.corsOrigins }))
  app.use(
    healthRouter(SERVICE_NAME, {
      database: () => db.$queryRaw`SELECT 1`,
      redis: () => redis.ping(),
    }),
  )
  app.use('/api', eventsRoutes(createEventsService({ db, cache, s3, audit, publisher }), auth))
  app.use(notFoundHandler)
  app.use(errorHandler(logger))

  return app
}
