import type { Redis } from './redis'

const key = (tokenId: string) => `auth:deny:${tokenId}`

/**
 * Revoked access tokens (logout). JWTs are stateless, so every service checks
 * this list; entries expire together with the token.
 */
export function createTokenDenylist(redis: Redis) {
  return {
    async revoke(tokenId: string, expiresAt: Date): Promise<void> {
      const ttlSeconds = Math.ceil((expiresAt.getTime() - Date.now()) / 1000)
      if (ttlSeconds > 0) await redis.set(key(tokenId), '1', 'EX', ttlSeconds)
    },
    async isRevoked(tokenId: string): Promise<boolean> {
      return (await redis.exists(key(tokenId))) === 1
    },
  }
}

export type TokenDenylist = ReturnType<typeof createTokenDenylist>
