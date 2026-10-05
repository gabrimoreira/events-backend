import type { AuditLogger } from '@eventflow/shared/audit'
import { CACHE_SCOPE, type Cache } from '@eventflow/shared/cache'
import { ApiError, type AuthUser } from '@eventflow/shared/http'
import type { Publisher } from '@eventflow/shared/messaging'
import type {
  Order,
  OrderQuery,
  Paginated,
  Purchase,
  PurchaseResult,
} from '@eventflow/shared/types'
import { createId, type Logger, pageWindow } from '@eventflow/shared/utils'
import type { DbClient, Prisma } from '@eventflow/db'

import { DEFAULT_PAGE_SIZE, MAX_TICKETS_PER_ORDER, SERVICE_FEE_RATE } from '@/constants'
import { orderInclude } from '@/repositories/orders.repository'
import { toOrder } from '@/utils/mappers'

import type { OrdersService } from './contracts'

export interface OrdersServiceDeps {
  db: DbClient
  cache: Cache
  audit: AuditLogger
  publisher: Publisher
  logger: Logger
}

const round = (value: number) => Math.round(value * 100) / 100

function orderTotals(subtotal: number) {
  const fee = round(subtotal * SERVICE_FEE_RATE)
  return { subtotal: round(subtotal), fee, total: round(subtotal + fee) }
}

function ticketCode(orderNumber: number, index: number) {
  return `TK-${orderNumber}-${String(index + 1).padStart(2, '0')}`
}

function buildOrderWhere({ status, eventId, from, search }: OrderQuery): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = {}
  if (status && status !== 'all') where.status = status
  if (eventId) where.eventId = eventId
  if (from) where.createdAt = { gte: new Date(from) }

  const term = search?.trim()
  if (term) {
    const or: Prisma.OrderWhereInput[] = [
      { customerName: { contains: term, mode: 'insensitive' } },
      { customerEmail: { contains: term, mode: 'insensitive' } },
    ]
    const number = Number(term.replace(/^ef-?/i, ''))
    if (Number.isInteger(number) && number > 0) or.push({ number })
    where.OR = or
  }
  return where
}

export function createOrdersService(deps: OrdersServiceDeps): OrdersService {
  return {
    async getOrders(query): Promise<Paginated<Order>> {
      const window = pageWindow(query.page, query.pageSize ?? DEFAULT_PAGE_SIZE)
      const where = buildOrderWhere(query)
      const [total, orders] = await deps.db.$transaction([
        deps.db.order.count({ where }),
        deps.db.order.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: window.skip,
          take: window.take,
          include: orderInclude,
        }),
      ])
      return window.toPaginated(orders.map(toOrder), total)
    },

    async getOrderById(id: string, actor: AuthUser): Promise<Order> {
      const order = await deps.db.order.findUnique({ where: { id }, include: orderInclude })
      if (!order || (order.customerId !== actor.id && actor.role !== 'admin')) {
        throw new ApiError('Pedido não encontrado.', 404, 'ORDER_NOT_FOUND')
      }
      await deps.audit.log({ action: 'READ', entity: 'ORDER', entityId: id, actorId: actor.id })
      return toOrder(order)
    },

    async createPurchase(purchase: Purchase, actor: AuthUser): Promise<PurchaseResult> {
      const items = purchase.items.filter((item) => item.quantity > 0)
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
      if (totalQuantity === 0) {
        throw new ApiError('Selecione ao menos um ingresso.', 422, 'EMPTY_ORDER')
      }
      if (totalQuantity > MAX_TICKETS_PER_ORDER) {
        throw new ApiError(
          `Limite de ${MAX_TICKETS_PER_ORDER} ingressos por pedido.`,
          422,
          'TICKET_LIMIT',
        )
      }
      if (new Set(items.map((item) => item.batchId)).size !== items.length) {
        throw new ApiError('Lote repetido no pedido.', 422, 'DUPLICATE_BATCH')
      }

      const { order, ticketIds } = await deps.db.$transaction(async (tx) => {
        const now = new Date()
        const event = await tx.event.findUnique({
          where: { id: purchase.eventId },
          include: { batches: true },
        })
        if (!event) throw new ApiError('Evento não encontrado.', 404, 'EVENT_NOT_FOUND')
        if (event.status !== 'published' || event.endsAt < now) {
          throw new ApiError('As vendas para este evento estão encerradas.', 409, 'SALES_CLOSED')
        }

        const lines = []
        for (const item of items) {
          const batch = event.batches.find((candidate) => candidate.id === item.batchId)
          if (!batch) {
            throw new ApiError(
              'Um dos lotes selecionados não está mais disponível.',
              409,
              'BATCH_UNAVAILABLE',
            )
          }
          const updated = await tx.$executeRaw`
            UPDATE ticket_batches
               SET sold = sold + ${item.quantity}, updated_at = now()
             WHERE id = ${batch.id}
               AND sold + ${item.quantity} <= quantity
               AND now() BETWEEN starts_at AND ends_at`
          if (updated === 0) {
            const current = await tx.ticketBatch.findUniqueOrThrow({ where: { id: batch.id } })
            const open = current.startsAt <= now && current.endsAt >= now
            const remaining = current.quantity - current.sold
            if (!open || remaining === 0) {
              throw new ApiError(
                'Um dos lotes selecionados não está mais disponível.',
                409,
                'BATCH_UNAVAILABLE',
              )
            }
            throw new ApiError(
              `Restam apenas ${remaining} ingressos em "${batch.name}".`,
              409,
              'SOLD_OUT',
            )
          }
          lines.push({ batch, quantity: item.quantity })
        }

        const totals = orderTotals(
          lines.reduce((sum, { batch, quantity }) => sum + batch.price.toNumber() * quantity, 0),
        )
        const created = await tx.order.create({
          data: {
            id: createId('ord'),
            customerId: actor.id,
            customerName: purchase.buyer.name,
            customerEmail: actor.email,
            customerCpf: purchase.buyer.cpf,
            eventId: event.id,
            eventTitle: event.title,
            ...totals,
            status: 'paid',
            paymentMethod: purchase.payment.method,
            paymentStatus: 'paid',
            cardLast4: purchase.payment.method === 'card' ? purchase.payment.cardLast4 : null,
            installments: purchase.payment.method === 'card' ? purchase.payment.installments : null,
            paidAt: now,
            items: {
              create: lines.map(({ batch, quantity }) => ({
                id: createId('itm'),
                batchId: batch.id,
                batchName: batch.name,
                unitPrice: batch.price,
                quantity,
              })),
            },
          },
          include: orderInclude,
        })

        const tickets = lines.flatMap(({ batch, quantity }) =>
          Array.from({ length: quantity }, () => ({
            batchId: batch.id,
            price: batch.price,
          })),
        )
        const ticketRows = tickets.map((ticket, index) => ({
          id: createId('tkt'),
          code: ticketCode(created.number, index),
          orderId: created.id,
          ownerId: actor.id,
          eventId: event.id,
          batchId: ticket.batchId,
          holderName: purchase.buyer.name,
          holderEmail: actor.email,
          price: ticket.price,
          status: 'processing' as const,
          issuedAt: now,
        }))
        await tx.ticket.createMany({ data: ticketRows })

        return { order: created, ticketIds: ticketRows.map((ticket) => ticket.id) }
      })

      await Promise.all([
        deps.cache.invalidate(CACHE_SCOPE.catalog),
        deps.cache.invalidate(CACHE_SCOPE.dashboard),
      ])
      await deps.audit.log({
        action: 'CREATE',
        entity: 'ORDER',
        entityId: order.id,
        actorId: actor.id,
        data: {
          number: `EF-${order.number}`,
          eventId: order.eventId,
          items: purchase.items,
          total: order.total,
          payment: purchase.payment.method,
          ticketIds,
        },
      })
      try {
        await deps.publisher.publish({
          type: 'ORDER_PAID',
          orderId: order.id,
          ticketIds,
          occurredAt: new Date().toISOString(),
        })
      } catch (error) {
        deps.logger.error({ err: error, orderId: order.id }, 'ORDER_PAID publish failed')
      }

      return { order: toOrder(order), ticketIds }
    },
  }
}
