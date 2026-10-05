import type { Request } from 'express'
import { z } from 'zod'

import { ApiError } from '../types'

z.config(z.locales.pt())

export function parseWith<T extends z.ZodType>(schema: T, data: unknown): z.output<T> {
  return schema.parse(data)
}

export const query = {
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  boolean: z.stringbool().optional(),
}

export function routeParam(req: Request, name: string): string {
  const value = req.params[name]
  if (typeof value !== 'string' || !value) {
    throw new ApiError('Parâmetro de rota inválido.', 400, 'INVALID_PARAM')
  }
  return value
}
