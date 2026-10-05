import type { DbClient, Prisma } from '@eventflow/db'

export const eventInclude = {
  batches: { orderBy: { position: 'asc' } },
} satisfies Prisma.EventInclude

export type EventWithBatches = Prisma.EventGetPayload<{ include: typeof eventInclude }>

export function createEventsRepository(db: DbClient) {
  return {
    findById: (id: string) => db.event.findUnique({ where: { id }, include: eventInclude }),
    findMany: (args: Omit<Prisma.EventFindManyArgs, 'include'>) =>
      db.event.findMany({ ...args, include: eventInclude }),
    count: (where: Prisma.EventWhereInput) => db.event.count({ where }),
  }
}

export type EventsRepository = ReturnType<typeof createEventsRepository>
