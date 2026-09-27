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

/**
 * Same operations as OrdersService/TicketsService/DashboardService in
 * events-frontend/src/services/contracts.ts; the authenticated user is passed explicitly.
 */
export interface OrdersService {
  /** Every order (admin). */
  getOrders(query: OrderQuery): Promise<Paginated<Order>>
  /** Owner or admin. */
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
  /** Tickets owned by the authenticated user. */
  getTickets(actor: AuthUser, scope?: TicketScope): Promise<Ticket[]>
  /** Owner or admin; includes a pre-signed `pdfUrl` once the worker generated it. */
  getTicketById(id: string, actor: AuthUser): Promise<Ticket>
  /** Every issued ticket (admin). */
  getAllTickets(query: AdminTicketQuery): Promise<Paginated<Ticket>>
}

export interface DashboardService {
  getDashboardStats(): Promise<DashboardStats>
}
