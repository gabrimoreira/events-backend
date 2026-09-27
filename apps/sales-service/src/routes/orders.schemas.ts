import { query } from '@eventflow/shared/http'
import { z } from 'zod'

import { MAX_TICKETS_PER_ORDER } from '@/constants'

/** GET /orders — mirrors OrderQuery (events-frontend/src/types/order.ts). */
export const orderQuerySchema = z.object({
  status: z.enum(['paid', 'pending', 'cancelled', 'all']).optional(),
  eventId: z.string().optional(),
  from: z.iso.datetime({ offset: true }).optional(),
  search: z.string().trim().optional(),
  page: query.page,
  pageSize: query.pageSize,
})

/** POST /orders — mirrors Purchase. */
export const purchaseSchema = z.object({
  eventId: z.string().min(1),
  items: z
    .array(
      z.object({
        batchId: z.string().min(1),
        quantity: z.number().int().min(0).max(MAX_TICKETS_PER_ORDER),
      }),
    )
    .min(1, 'Selecione ao menos um ingresso.'),
  buyer: z.object({
    name: z.string().trim().min(3),
    email: z.email().trim().toLowerCase(),
    cpf: z.string().regex(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, 'Informe um CPF válido.'),
  }),
  payment: z.object({
    method: z.enum(['card', 'pix']),
    cardLast4: z
      .string()
      .regex(/^\d{4}$/)
      .optional(),
    installments: z.number().int().min(1).max(12).optional(),
  }),
})
