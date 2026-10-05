import { GetObjectCommand, type S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { AuditLogger } from '@eventflow/shared/audit'
import { ApiError, type AuthUser } from '@eventflow/shared/http'
import type { Paginated, Ticket, TicketScope } from '@eventflow/shared/types'
import { pageWindow } from '@eventflow/shared/utils'
import type { DbClient, Prisma } from '@eventflow/db'

import { env } from '@/config/env'
import { DEFAULT_PAGE_SIZE, TICKET_PDF, UPCOMING_GRACE_MS } from '@/constants'
import { ticketInclude, type TicketWithEvent } from '@/repositories/tickets.repository'
import { toTicket } from '@/utils/mappers'

import type { AdminTicketQuery, TicketsService } from './contracts'

export interface TicketsServiceDeps {
  db: DbClient
  s3: S3Client
  audit: AuditLogger
}

function isUpcoming(ticket: TicketWithEvent, now = Date.now()): boolean {
  if (ticket.status === 'used' || ticket.status === 'cancelled') return false
  return ticket.event.startsAt.getTime() + UPCOMING_GRACE_MS > now
}

function buildAdminWhere({ search, status, eventId }: AdminTicketQuery): Prisma.TicketWhereInput {
  const where: Prisma.TicketWhereInput = {}
  if (status && status !== 'all') where.status = status
  if (eventId) where.eventId = eventId
  const term = search?.trim()
  if (term) {
    where.OR = [
      { code: { contains: term, mode: 'insensitive' } },
      { holderName: { contains: term, mode: 'insensitive' } },
      { holderEmail: { contains: term, mode: 'insensitive' } },
      { event: { title: { contains: term, mode: 'insensitive' } } },
    ]
  }
  return where
}

export function createTicketsService(deps: TicketsServiceDeps): TicketsService {
  const withPdfUrl = async (ticket: TicketWithEvent): Promise<Ticket> => {
    if (!ticket.pdfKey) return toTicket(ticket)
    const pdfUrl = await getSignedUrl(
      deps.s3,
      new GetObjectCommand({
        Bucket: env.s3Bucket,
        Key: ticket.pdfKey,
        ResponseContentDisposition: `attachment; filename="ingresso-${ticket.code}.pdf"`,
      }),
      { expiresIn: TICKET_PDF.urlTtlSeconds },
    )
    return toTicket(ticket, pdfUrl)
  }

  return {
    async getTickets(actor: AuthUser, scope?: TicketScope): Promise<Ticket[]> {
      const owned = await deps.db.ticket.findMany({
        where: { ownerId: actor.id },
        include: ticketInclude,
      })
      const now = Date.now()
      const scoped = scope
        ? owned.filter((ticket) => isUpcoming(ticket, now) === (scope === 'upcoming'))
        : owned
      const direction = scope === 'past' ? -1 : 1
      scoped.sort((a, b) => direction * (a.event.startsAt.getTime() - b.event.startsAt.getTime()))
      return Promise.all(scoped.map(withPdfUrl))
    },

    async getTicketById(id: string, actor: AuthUser): Promise<Ticket> {
      const ticket = await deps.db.ticket.findUnique({ where: { id }, include: ticketInclude })
      if (!ticket || (ticket.ownerId !== actor.id && actor.role !== 'admin')) {
        throw new ApiError('Ingresso não encontrado.', 404, 'TICKET_NOT_FOUND')
      }
      await deps.audit.log({ action: 'READ', entity: 'TICKET', entityId: id, actorId: actor.id })
      return withPdfUrl(ticket)
    },

    async getAllTickets(query: AdminTicketQuery): Promise<Paginated<Ticket>> {
      const window = pageWindow(query.page, query.pageSize ?? DEFAULT_PAGE_SIZE)
      const where = buildAdminWhere(query)
      const [total, tickets] = await deps.db.$transaction([
        deps.db.ticket.count({ where }),
        deps.db.ticket.findMany({
          where,
          orderBy: { issuedAt: 'desc' },
          skip: window.skip,
          take: window.take,
          include: ticketInclude,
        }),
      ])
      return window.toPaginated(await Promise.all(tickets.map(withPdfUrl)), total)
    },
  }
}
