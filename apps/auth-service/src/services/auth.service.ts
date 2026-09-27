import type { AuditLogger } from '@eventflow/shared/audit'
import type { TokenDenylist } from '@eventflow/shared/cache'
import { notImplemented } from '@eventflow/shared/http'
import type { DbClient } from '@eventflow/db'

import type { AuthService } from './contracts'

export interface AuthServiceDeps {
  db: DbClient
  audit: AuditLogger
  denylist: TokenDenylist
}

/**
 * Accounts and sessions: bcrypt password hashes (BCRYPT_ROUNDS), access tokens via
 * `signAccessToken`, `USER` CREATE/UPDATE entries in the audit log, 409 EMAIL_TAKEN
 * and 401 INVALID_CREDENTIALS with the same messages as the frontend mocks.
 *
 * Dependencies are already wired — rename `_deps` when implementing.
 */
export function createAuthService(_deps: AuthServiceDeps): AuthService {
  return {
    async login() {
      return notImplemented()
    },
    async register() {
      return notImplemented()
    },
    async getCurrentUser() {
      return notImplemented()
    },
    async updateProfile() {
      return notImplemented()
    },
    async logout() {
      return notImplemented()
    },
  }
}
