import type { Event } from '@eventflow/shared/types'

const DAY_MS = 86_400_000
const TZ_OFFSET = '-03:00'

export const DEMO_CREDENTIALS = {
  customer: { email: 'ana@eventflow.com', password: 'demo123' },
  admin: { email: 'admin@eventflow.com', password: 'admin123' },
} as const

export const SERVICE_FEE_RATE = 0.1

const round = (value: number) => Math.round(value * 100) / 100

export function orderTotals(subtotal: number) {
  const fee = round(subtotal * SERVICE_FEE_RATE)
  return { subtotal: round(subtotal), fee, total: round(subtotal + fee) }
}

export function isEventPast(event: Pick<Event, 'endsAt'>, now = Date.now()): boolean {
  return new Date(event.endsAt).getTime() < now
}

export function daysFromNow(days: number, time = '20:00'): string {
  const target = new Date(Date.now() + days * DAY_MS)
  const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Fortaleza' }).format(target)
  return new Date(`${ymd}T${time}:00${TZ_OFFSET}`).toISOString()
}

export function addHours(iso: string, hours: number): string {
  return new Date(new Date(iso).getTime() + hours * 3_600_000).toISOString()
}

export function createRandom(seed: number) {
  let state = seed >>> 0
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296
  }
  return {
    next,
    int: (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min,
    pick: <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)]!,
  }
}
