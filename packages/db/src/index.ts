import { PrismaPg } from '@prisma/adapter-pg'

import { PrismaClient } from './generated/prisma/client'

export * from './generated/prisma/client'

/** One client per process; Prisma pools connections internally (node-postgres). */
export function createDbClient(databaseUrl: string) {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) })
}

export type DbClient = ReturnType<typeof createDbClient>
