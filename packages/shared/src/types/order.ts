export type OrderStatus = 'paid' | 'pending' | 'cancelled'

export type PaymentMethod = 'card' | 'pix'

export interface Payment {
  method: PaymentMethod
  status: OrderStatus
  cardLast4?: string
  installments?: number
  paidAt?: string
}

export interface OrderItem {
  batchId: string
  batchName: string
  unitPrice: number
  quantity: number
}

export interface Order {
  id: string
  number: string
  customerId: string
  customerName: string
  customerEmail: string
  eventId: string
  eventTitle: string
  items: OrderItem[]
  subtotal: number
  fee: number
  total: number
  payment: Payment
  status: OrderStatus
  createdAt: string
}

export interface Buyer {
  name: string
  email: string
  cpf: string
}

export interface PurchaseItem {
  batchId: string
  quantity: number
}

export interface Purchase {
  eventId: string
  items: PurchaseItem[]
  buyer: Buyer
  payment: { method: PaymentMethod; cardLast4?: string; installments?: number }
}

export interface PurchaseResult {
  order: Order
  ticketIds: string[]
}

export interface OrderQuery {
  status?: OrderStatus | 'all'
  eventId?: string
  from?: string
  search?: string
  page?: number
  pageSize?: number
}
