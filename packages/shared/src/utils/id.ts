export function createId(prefix: string): string {
  const random = crypto.randomUUID().replace(/-/g, '').slice(0, 10)
  return `${prefix}_${random}`
}

export function createCode(length = 8): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('')
}
