import type { AuthUser } from '@eventflow/shared/http'
import type { AuthSession, LoginPayload, RegisterPayload, User } from '@eventflow/shared/types'

export type ProfileChanges = Partial<Pick<User, 'name' | 'phone' | 'city'>>

/**
 * Same operations as AuthService in events-frontend/src/services/contracts.ts;
 * the authenticated user is passed explicitly instead of read from storage.
 */
export interface AuthService {
  login(payload: LoginPayload): Promise<AuthSession>
  register(payload: RegisterPayload): Promise<AuthSession>
  getCurrentUser(actor: AuthUser): Promise<User>
  updateProfile(actor: AuthUser, changes: ProfileChanges): Promise<User>
  /** Revokes the current token (Redis denylist). */
  logout(actor: AuthUser): Promise<void>
}
