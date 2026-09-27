import type { DbClient, Prisma } from '@eventflow/db'

/** Event and batch data denormalized into every Ticket response. */
export const ticketInclude = {
  event: {
    select: {
      title: true,
      startsAt: true,
      bannerUrl: true,
      category: true,
      venueName: true,
      venueCity: true,
      venueState: true,
    },
  },
  batch: { select: { name: true } },
} satisfies Prisma.TicketInclude

export type TicketWithEvent = Prisma.TicketGetPayload<{ include: typeof ticketInclude }>

/** Data access for `tickets` (owned by sales-service; the worker updates status/pdf_key). */
export function createTicketsRepository(db: DbClient) {
  return {
    findById: (id: string) => db.ticket.findUnique({ where: { id }, include: ticketInclude }),
    findMany: (args: Omit<Prisma.TicketFindManyArgs, 'include'>) =>
      db.ticket.findMany({ ...args, include: ticketInclude }),
    count: (where: Prisma.TicketWhereInput) => db.ticket.count({ where }),
  }
}

export type TicketsRepository = ReturnType<typeof createTicketsRepository>
