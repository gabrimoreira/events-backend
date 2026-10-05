import cors from 'cors'
import express, { type RequestHandler } from 'express'
import { pinoHttp } from 'pino-http'

import type { Logger } from '../utils'

interface CommonMiddlewareOptions {
  logger: Logger
  corsOrigins: string[]
  bodyLimit?: string
}

export function commonMiddlewares({
  logger,
  corsOrigins,
  bodyLimit = '3mb',
}: CommonMiddlewareOptions): RequestHandler[] {
  return [
    pinoHttp({
      logger,
      autoLogging: { ignore: (req) => req.url === '/health' },
      customLogLevel: (_req, res, error) =>
        error || (res.statusCode >= 500 && res.statusCode !== 501)
          ? 'error'
          : res.statusCode >= 400
            ? 'warn'
            : 'info',
      serializers: {
        req: (req: { method: string; url: string }) => ({ method: req.method, url: req.url }),
        res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
      },
    }),
    cors({ origin: corsOrigins }),
    express.json({ limit: bodyLimit }),
  ]
}
