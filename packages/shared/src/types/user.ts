export type UserRole = 'customer' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  cpf: string
  phone?: string
  city?: string
  role: UserRole
  avatarUrl?: string
  createdAt: string
}

export interface AuthSession {
  user: User
  token: string
  expiresAt: string
}

export interface LoginPayload {
  email: string
  password: string
  remember: boolean
}

export interface RegisterPayload {
  name: string
  email: string
  cpf: string
  password: string
}
