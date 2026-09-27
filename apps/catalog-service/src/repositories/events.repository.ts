import type { DbClient, Prisma } from '@eventflow/db'

/** Relations every Event response needs (batches in display order). */
export const eventInclude = {
  batches: { orderBy: { position: 'asc' } },
} satisfies Prisma.EventInclude

export type EventWithBatches = Prisma.EventGetPayload<{ include: typeof eventInclude }>

/** Data access for `events` and `ticket_batches` (owned by catalog-service). */
export function createEventsRepository(db: DbClient) {
  return {
    findById: (id: string) => db.event.findUnique({ where: { id }, include: eventInclude }),
    findMany: (args: Omit<Prisma.EventFindManyArgs, 'include'>) =>
      db.event.findMany({ ...args, include: eventInclude }),
    count: (where: Prisma.EventWhereInput) => db.event.count({ where }),
  }
}

export type EventsRepository = ReturnType<typeof createEventsRepository>
