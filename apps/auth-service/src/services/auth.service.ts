import bcrypt from 'bcryptjs'
import { createId } from '@eventflow/shared/utils'
import type { AuditLogger } from '@eventflow/shared/audit'
import type { TokenDenylist } from '@eventflow/shared/cache'
import { ApiError, signAccessToken } from '@eventflow/shared/http'
import type { DbClient } from '@eventflow/db'

import { env } from '@/config/env'
import { toUser } from '@/utils/mappers'

import type { AuthService } from './contracts'
import { BCRYPT_ROUNDS } from '@/constants'

export interface AuthServiceDeps {
  db: DbClient
  audit: AuditLogger
  denylist: TokenDenylist
}


export function createAuthService(deps: AuthServiceDeps): AuthService {
  return {
    async login(payload) {
      const user = await deps.db.user.findUnique({
        where: { email: payload.email },
      })

      if (!user || !(await bcrypt.compare(payload.password, user.passwordHash))) {
        throw new ApiError('E-mail ou senha incorretos.', 401, 'INVALID_CREDENTIALS')
      }

      const ttlHours = payload.remember ? 7 * 24 : env.jwtTtlHours
      const { token, expiresAt } = signAccessToken(
        { id: user.id, name: user.name, email: user.email, role: user.role },
        env.jwtSecret,
        ttlHours,
      )

      return {
        user: toUser(user),
        token,
        expiresAt: expiresAt.toISOString(),
      }
    },
    async register(payload) {
      const existing = await deps.db.user.findUnique({
        where: { email: payload.email }
      })
      if (existing) throw new ApiError("Email já cadastrado.", 409, 'EMAIL_TAKEN');

      const user = await deps.db.user.create({
        data: {
          id: createId("usr"),
          email: payload.email,
          name: payload.name,
          cpf: payload.cpf,
          passwordHash: await bcrypt.hash(payload.password, BCRYPT_ROUNDS),
        }
      }
      )

      await deps.audit.log({
        action: 'CREATE',
        entity: 'USER',
        entityId: user.id,
        data: { name: user.name, email: user.email, cpf: user.cpf },
      })

      const { token, expiresAt } = signAccessToken({
        id: user.id, name: user.name, email: user.email, role: user.role
      },
        env.jwtSecret,
        env.jwtTtlHours,
      )
      return {
        user: toUser(user),
        token,
        expiresAt: expiresAt.toISOString(),
      }
    },

    async getCurrentUser(actor) {
      const user = await deps.db.user.findUnique({
        where: { id: actor.id },
      })
      if (!user) throw new ApiError('Usuário não encontrado.', 404, 'USER_NOT_FOUND')
      return toUser(user)
    },

    async updateProfile(actor, changes) {
      const updated = await deps.db.user.update({
        where: { id: actor.id },
        data: changes,
      })

      await deps.audit.log({
        action: 'UPDATE',
        entity: 'USER',
        entityId: updated.id,
        actorId: actor.id,
        data: changes,
      })

      return toUser(updated)
    },
    async logout(actor) {
      await deps.denylist.revoke(actor.tokenId, actor.expiresAt)
    },
  }
}

