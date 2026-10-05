import { CACHE_SCOPE, type Cache } from '@eventflow/shared/cache'
import type {
  CategoryShare,
  DailySales,
  DashboardStats,
  EventCategory,
} from '@eventflow/shared/types'
import type { DbClient } from '@eventflow/db'

import { CACHE_TTL } from '@/constants'

import type { DashboardService } from './contracts'

export interface DashboardServiceDeps {
  db: DbClient
  cache: Cache
}

const DAY_MS = 86_400_000
const PERIOD_DAYS = 7
const TIME_ZONE = 'America/Sao_Paulo'

const dayKey = (date: Date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(date)

const round = (value: number) => Math.round(value * 100) / 100

function change(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 1 : 0
  return round((current - previous) / previous)
}

interface PeriodOrder {
  total: { toNumber(): number }
  createdAt: Date
  items: { quantity: number }[]
}

function summarize(orders: PeriodOrder[]) {
  return {
    orders: orders.length,
    revenue: orders.reduce((sum, order) => sum + order.total.toNumber(), 0),
    tickets: orders.reduce(
      (sum, order) => sum + order.items.reduce((acc, item) => acc + item.quantity, 0),
      0,
    ),
  }
}

export function createDashboardService(deps: DashboardServiceDeps): DashboardService {
  async function compute(): Promise<DashboardStats> {
    const now = new Date()
    const periodStart = new Date(now.getTime() - PERIOD_DAYS * DAY_MS)
    const previousStart = new Date(now.getTime() - 2 * PERIOD_DAYS * DAY_MS)

    const [listed, totalOrders, recentOrders] = await Promise.all([
      deps.db.event.findMany({
        where: { status: { not: 'draft' } },
        select: {
          id: true,
          title: true,
          category: true,
          status: true,
          endsAt: true,
          batches: { select: { sold: true, price: true } },
        },
      }),
      deps.db.order.count(),
      deps.db.order.findMany({
        where: { status: 'paid', createdAt: { gte: previousStart } },
        select: { total: true, createdAt: true, items: { select: { quantity: true } } },
      }),
    ])

    const events = listed.map((event) => ({
      ...event,
      sold: event.batches.reduce((sum, batch) => sum + batch.sold, 0),
      revenue: event.batches.reduce((sum, batch) => sum + batch.sold * batch.price.toNumber(), 0),
    }))
    const upcoming = events.filter((event) => event.endsAt >= now)

    const current = summarize(recentOrders.filter((order) => order.createdAt >= periodStart))
    const previous = summarize(recentOrders.filter((order) => order.createdAt < periodStart))

    const salesLast7Days: DailySales[] = Array.from({ length: PERIOD_DAYS }, (_, index) => {
      const day = new Date(now.getTime() - (PERIOD_DAYS - 1 - index) * DAY_MS)
      const key = dayKey(day)
      const sameDay = summarize(recentOrders.filter((order) => dayKey(order.createdAt) === key))
      return {
        date: new Date(`${key}T12:00:00-03:00`).toISOString(),
        revenue: round(sameDay.revenue),
        tickets: sameDay.tickets,
      }
    })

    const byCategory = new Map<EventCategory, number>()
    for (const event of events) {
      byCategory.set(event.category, (byCategory.get(event.category) ?? 0) + event.sold)
    }
    const categoryDistribution: CategoryShare[] = [...byCategory.entries()]
      .map(([category, tickets]) => ({ category, tickets }))
      .sort((a, b) => b.tickets - a.tickets)

    return {
      activeEvents: {
        value: upcoming.filter((event) => event.status === 'published').length,
        change: 0,
      },
      ticketsSold: {
        value: events.reduce((sum, event) => sum + event.sold, 0),
        change: change(current.tickets, previous.tickets),
      },
      revenue: {
        value: round(events.reduce((sum, event) => sum + event.revenue, 0)),
        change: change(current.revenue, previous.revenue),
      },
      orders: { value: totalOrders, change: change(current.orders, previous.orders) },
      salesLast7Days,
      topEvents: upcoming
        .map((event) => ({
          eventId: event.id,
          title: event.title,
          ticketsSold: event.sold,
          revenue: round(event.revenue),
        }))
        .sort((a, b) => b.ticketsSold - a.ticketsSold)
        .slice(0, 5),
      categoryDistribution,
    }
  }

  return {
    getDashboardStats: () =>
      deps.cache.remember(CACHE_SCOPE.dashboard, 'stats', CACHE_TTL.dashboard, compute),
  }
}
