import type { AuthUser } from '@eventflow/shared/http'
import type {
  DashboardStats,
  Order,
  OrderQuery,
  Paginated,
  Purchase,
  PurchaseResult,
  Ticket,
  TicketScope,
  TicketStatus,
} from '@eventflow/shared/types'

export interface OrdersService {
  getOrders(query: OrderQuery): Promise<Paginated<Order>>
  getOrderById(id: string, actor: AuthUser): Promise<Order>
  createPurchase(purchase: Purchase, actor: AuthUser): Promise<PurchaseResult>
}

export interface AdminTicketQuery {
  search?: string
  status?: TicketStatus | 'all'
  eventId?: string
  page?: number
  pageSize?: number
}

export interface TicketsService {
  getTickets(actor: AuthUser, scope?: TicketScope): Promise<Ticket[]>
  getTicketById(id: string, actor: AuthUser): Promise<Ticket>
  getAllTickets(query: AdminTicketQuery): Promise<Paginated<Ticket>>
}

export interface DashboardService {
  getDashboardStats(): Promise<DashboardStats>
}
