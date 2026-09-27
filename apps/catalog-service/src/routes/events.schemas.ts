import { query } from '@eventflow/shared/http'
import { z } from 'zod'

const category = z.enum(['shows', 'festivais', 'esportes', 'tecnologia', 'cultura', 'gastronomia'])
const status = z.enum(['draft', 'published', 'cancelled', 'finished'])
const isoDate = z.iso.datetime({ offset: true })

/** GET /events — mirrors EventQuery (events-frontend/src/types/event.ts). */
export const eventQuerySchema = z.object({
  search: z.string().trim().optional(),
  category: category.optional(),
  city: z.string().optional(),
  from: isoDate.optional(),
  priceRange: z.enum(['free-50', '50-100', '100-200', '200-plus']).optional(),
  sort: z.enum(['relevance', 'recent', 'date', 'price-asc', 'price-desc']).optional(),
  status: z.union([status, z.literal('all')]).optional(),
  featured: query.boolean,
  page: query.page,
  pageSize: query.pageSize,
})

const batchSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, 'Informe o nome do lote.'),
  price: z.number().min(0),
  quantity: z.number().int().positive(),
  startsAt: isoDate,
  endsAt: isoDate,
})

/** POST/PUT /events — mirrors EventInput. `bannerUrl` is an http(s) URL or a data URL (upload). */
export const eventInputSchema = z
  .object({
    title: z.string().trim().min(3),
    summary: z.string().trim().min(1),
    description: z.string().trim().min(1),
    category,
    startsAt: isoDate,
    endsAt: isoDate,
    venue: z.object({
      name: z.string().trim().min(1),
      address: z.string().trim().min(1),
      city: z.string().trim().min(1),
      state: z.string().trim().length(2),
    }),
    bannerUrl: z.string().min(1, 'Envie um banner para o evento.'),
    status,
    featured: z.boolean(),
    batches: z.array(batchSchema).min(1, 'Cadastre ao menos um lote.'),
  })
  .refine((event) => event.endsAt > event.startsAt, {
    message: 'O término deve ser depois do início.',
    path: ['endsAt'],
  })
