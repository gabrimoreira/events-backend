import type { EventCategory } from './event'

export interface KpiValue {
  value: number
  change: number
}

export interface DailySales {
  date: string
  revenue: number
  tickets: number
}

export interface TopEvent {
  eventId: string
  title: string
  ticketsSold: number
  revenue: number
}

export interface CategoryShare {
  category: EventCategory
  tickets: number
}

export interface DashboardStats {
  activeEvents: KpiValue
  ticketsSold: KpiValue
  revenue: KpiValue
  orders: KpiValue
  salesLast7Days: DailySales[]
  topEvents: TopEvent[]
  categoryDistribution: CategoryShare[]
}
