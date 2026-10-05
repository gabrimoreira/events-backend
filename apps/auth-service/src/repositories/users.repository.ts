import type { DbClient, Prisma } from '@eventflow/db'

export function createUsersRepository(db: DbClient) {
  return {
    findById: (id: string) => db.user.findUnique({ where: { id } }),
    findByEmail: (email: string) => db.user.findUnique({ where: { email } }),
    create: (data: Prisma.UserCreateInput) => db.user.create({ data }),
    update: (id: string, data: Prisma.UserUpdateInput) => db.user.update({ where: { id }, data }),
  }
}

export type UsersRepository = ReturnType<typeof createUsersRepository>
