import type { EventCategory } from './event'

export type TicketStatus = 'processing' | 'valid' | 'used' | 'cancelled'

export interface Ticket {
  id: string
  code: string
  orderId: string
  eventId: string
  eventTitle: string
  eventStartsAt: string
  eventBannerUrl: string
  eventCategory: EventCategory
  venueName: string
  venueCity: string
  batchId: string
  batchName: string
  holderName: string
  holderEmail: string
  price: number
  status: TicketStatus
  issuedAt: string
  pdfUrl?: string
}

export type TicketScope = 'upcoming' | 'past'
