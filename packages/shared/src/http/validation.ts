import type { Request } from 'express'
import { z } from 'zod'

import { ApiError } from '../types'

// Validation messages in Portuguese — they reach the user through the frontend.
z.config(z.locales.pt())

/** Parses request data; a ZodError becomes `422 { message }` in the error handler. */
export function parseWith<T extends z.ZodType>(schema: T, data: unknown): z.output<T> {
  return schema.parse(data)
}

/** Query-string helpers: values arrive as strings. */
export const query = {
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  boolean: z.stringbool().optional(),
}

/** Route parameter as a string (Express loses the path typing when middlewares precede the handler). */
export function routeParam(req: Request, name: string): string {
  const value = req.params[name]
  if (typeof value !== 'string' || !value) {
    throw new ApiError('Parâmetro de rota inválido.', 400, 'INVALID_PARAM')
  }
  return value
}
