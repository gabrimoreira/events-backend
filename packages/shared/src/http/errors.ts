import type { ErrorRequestHandler, RequestHandler } from 'express'
import { ZodError } from 'zod'

import { ApiError } from '../types'
import type { Logger } from '../utils'

export function notImplemented(): never {
  throw new ApiError('Não implementado.', 501, 'NOT_IMPLEMENTED')
}

export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(new ApiError('Rota não encontrada.', 404, 'ROUTE_NOT_FOUND'))
}

function isBodyParserError(error: unknown): error is { type: string; status: number } {
  return typeof error === 'object' && error !== null && 'type' in error && 'status' in error
}

export function errorHandler(logger: Logger): ErrorRequestHandler {
  return (error, req, res, _next) => {
    if (error instanceof ApiError) {
      if (error.status >= 500 && error.status !== 501) logger.error({ err: error }, error.message)
      res.status(error.status).json({ message: error.message, code: error.code })
      return
    }
    if (error instanceof ZodError) {
      const issue = error.issues[0]
      res
        .status(422)
        .json({ message: issue?.message ?? 'Dados inválidos.', code: 'VALIDATION_ERROR' })
      return
    }
    if (isBodyParserError(error)) {
      const tooLarge = error.type === 'entity.too.large'
      res.status(tooLarge ? 413 : 400).json({
        message: tooLarge
          ? 'A requisição excede o tamanho máximo permitido.'
          : 'Corpo da requisição inválido.',
        code: tooLarge ? 'PAYLOAD_TOO_LARGE' : 'INVALID_BODY',
      })
      return
    }
    logger.error({ err: error, method: req.method, url: req.originalUrl }, 'unhandled error')
    res.status(500).json({ message: 'Erro interno do servidor.', code: 'INTERNAL_ERROR' })
  }
}
