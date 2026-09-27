import type { Order, Ticket } from '@eventflow/shared/types'

import type { OrderWithItems } from '@/repositories/orders.repository'
import type { TicketWithEvent } from '@/repositories/tickets.repository'

/** Database row → API contract (events-frontend/src/types/order.ts). */
export function toOrder(record: OrderWithItems): Order {
  return {
    id: record.id,
    number: `EF-${record.number}`,
    customerId: record.customerId,
    customerName: record.customerName,
    customerEmail: record.customerEmail,
    eventId: record.eventId,
    eventTitle: record.eventTitle,
    items: record.items.map((item) => ({
      batchId: item.batchId,
      batchName: item.batchName,
      unitPrice: item.unitPrice.toNumber(),
      quantity: item.quantity,
    })),
    subtotal: record.subtotal.toNumber(),
    fee: record.fee.toNumber(),
    total: record.total.toNumber(),
    payment: {
      method: record.paymentMethod,
      status: record.paymentStatus,
      cardLast4: record.cardLast4 ?? undefined,
      installments: record.installments ?? undefined,
      paidAt: record.paidAt?.toISOString(),
    },
    status: record.status,
    createdAt: record.createdAt.toISOString(),
  }
}

/** Database row → API contract (events-frontend/src/types/ticket.ts). */
export function toTicket(record: TicketWithEvent, pdfUrl?: string): Ticket {
  return {
    id: record.id,
    code: record.code,
    orderId: record.orderId,
    eventId: record.eventId,
    eventTitle: record.event.title,
    eventStartsAt: record.event.startsAt.toISOString(),
    eventBannerUrl: record.event.bannerUrl,
    eventCategory: record.event.category,
    venueName: record.event.venueName,
    venueCity: `${record.event.venueCity}, ${record.event.venueState}`,
    batchId: record.batchId,
    batchName: record.batch.name,
    holderName: record.holderName,
    holderEmail: record.holderEmail,
    price: record.price.toNumber(),
    status: record.status,
    issuedAt: record.issuedAt.toISOString(),
    pdfUrl,
  }
}
