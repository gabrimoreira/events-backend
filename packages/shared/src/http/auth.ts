import { randomUUID } from 'node:crypto'

import type { RequestHandler, Request } from 'express'
import jwt from 'jsonwebtoken'

import { ApiError, type User, type UserRole } from '../types'

/** Identity carried by the access token and attached to `req.user`. */
export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  tokenId: string
  expiresAt: Date
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser
  }
}

interface TokenClaims {
  sub: string
  name: string
  email: string
  role: UserRole
  jti: string
  exp: number
}

export interface AuthOptions {
  secret: string
  /** Logout denylist check (see createTokenDenylist). */
  isRevoked?: (tokenId: string) => Promise<boolean>
}

const unauthenticated = () =>
  new ApiError('Sua sessão expirou. Entre novamente.', 401, 'UNAUTHENTICATED')

/** Issued by auth-service; verified locally by every service with the shared secret. */
export function signAccessToken(
  user: Pick<User, 'id' | 'name' | 'email' | 'role'>,
  secret: string,
  ttlHours: number,
) {
  const tokenId = randomUUID()
  const expiresAt = new Date(Date.now() + ttlHours * 3_600_000)
  const token = jwt.sign({ name: user.name, email: user.email, role: user.role }, secret, {
    subject: user.id,
    jwtid: tokenId,
    expiresIn: ttlHours * 3600,
    algorithm: 'HS256',
  })
  return { token, tokenId, expiresAt }
}

export function verifyAccessToken(token: string, secret: string): AuthUser {
  try {
    const claims = jwt.verify(token, secret, { algorithms: ['HS256'] }) as TokenClaims
    return {
      id: claims.sub,
      name: claims.name,
      email: claims.email,
      role: claims.role,
      tokenId: claims.jti,
      expiresAt: new Date(claims.exp * 1000),
    }
  } catch {
    throw unauthenticated()
  }
}

function bearerToken(req: Request): string | null {
  const [scheme, token] = req.headers.authorization?.split(' ') ?? []
  return scheme === 'Bearer' && token ? token : null
}

/** Rejects the request with 401 unless it carries a valid, non-revoked token. */
export function requireAuth({ secret, isRevoked }: AuthOptions): RequestHandler {
  return async (req, _res, next) => {
    const token = bearerToken(req)
    if (!token) throw unauthenticated()
    const user = verifyAccessToken(token, secret)
    if (isRevoked && (await isRevoked(user.tokenId))) throw unauthenticated()
    req.user = user
    next()
  }
}

/**
 * Attaches `req.user` when a token is sent and lets anonymous requests through
 * (public listings that show more to admins). An invalid token is still a 401.
 */
export function optionalAuth(options: AuthOptions): RequestHandler {
  const authenticate = requireAuth(options)
  return (req, res, next) => (bearerToken(req) ? authenticate(req, res, next) : next())
}

/** Must run after requireAuth. */
export const requireAdmin: RequestHandler = (req, _res, next) => {
  if (req.user?.role !== 'admin') {
    throw new ApiError('Acesso restrito a administradores.', 403, 'FORBIDDEN')
  }
  next()
}

/** The authenticated user inside a handler protected by requireAuth. */
export function currentUser(req: Request): AuthUser {
  if (!req.user) throw unauthenticated()
  return req.user
}
