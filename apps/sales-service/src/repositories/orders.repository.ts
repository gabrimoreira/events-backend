import type { DbClient, Prisma } from '@eventflow/db'

export const orderInclude = {
  items: true,
} satisfies Prisma.OrderInclude

export type OrderWithItems = Prisma.OrderGetPayload<{ include: typeof orderInclude }>

/** Data access for `orders` and `order_items` (owned by sales-service). */
export function createOrdersRepository(db: DbClient) {
  return {
    findById: (id: string) => db.order.findUnique({ where: { id }, include: orderInclude }),
    findMany: (args: Omit<Prisma.OrderFindManyArgs, 'include'>) =>
      db.order.findMany({ ...args, include: orderInclude }),
    count: (where: Prisma.OrderWhereInput) => db.order.count({ where }),
  }
}

export type OrdersRepository = ReturnType<typeof createOrdersRepository>
