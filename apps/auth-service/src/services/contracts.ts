import type { AuthUser } from '@eventflow/shared/http'
import type { AuthSession, LoginPayload, RegisterPayload, User } from '@eventflow/shared/types'

export type ProfileChanges = Partial<Pick<User, 'name' | 'phone' | 'city'>>

export interface AuthService {
  login(payload: LoginPayload): Promise<AuthSession>
  register(payload: RegisterPayload): Promise<AuthSession>
  getCurrentUser(actor: AuthUser): Promise<User>
  updateProfile(actor: AuthUser, changes: ProfileChanges): Promise<User>
  logout(actor: AuthUser): Promise<void>
}
