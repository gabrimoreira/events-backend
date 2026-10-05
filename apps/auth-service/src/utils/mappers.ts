import type { User as UserRecord } from '@eventflow/db'
import type { User } from '@eventflow/shared/types'

export function toUser(record: UserRecord): User {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    cpf: record.cpf,
    phone: record.phone ?? undefined,
    city: record.city ?? undefined,
    role: record.role,
    avatarUrl: record.avatarUrl ?? undefined,
    createdAt: record.createdAt.toISOString(),
  }
}
