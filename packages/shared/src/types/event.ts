export type EventCategory =
  'shows' | 'festivais' | 'esportes' | 'tecnologia' | 'cultura' | 'gastronomia'

export type EventStatus = 'draft' | 'published' | 'cancelled' | 'finished'

export interface Venue {
  name: string
  address: string
  city: string
  state: string
}

export interface Organizer {
  name: string
  verified: boolean
  eventsCount: number
}

export interface TicketBatch {
  id: string
  name: string
  description?: string
  price: number
  quantity: number
  sold: number
  startsAt: string
  endsAt: string
}

export interface Event {
  id: string
  title: string
  summary: string
  description: string
  category: EventCategory
  startsAt: string
  endsAt: string
  venue: Venue
  bannerUrl: string
  organizer: Organizer
  batches: TicketBatch[]
  status: EventStatus
  featured: boolean
  tags: string[]
  createdAt: string
  updatedAt: string
}

export type EventSort = 'relevance' | 'recent' | 'date' | 'price-asc' | 'price-desc'

export type PriceRange = 'free-50' | '50-100' | '100-200' | '200-plus'

export interface EventQuery {
  search?: string
  category?: EventCategory
  city?: string
  from?: string
  priceRange?: PriceRange
  sort?: EventSort
  status?: EventStatus | 'all'
  featured?: boolean
  page?: number
  pageSize?: number
}

export interface TicketBatchInput {
  id?: string
  name: string
  price: number
  quantity: number
  startsAt: string
  endsAt: string
}

export interface EventInput {
  title: string
  summary: string
  description: string
  category: EventCategory
  startsAt: string
  endsAt: string
  venue: Venue
  bannerUrl: string
  status: EventStatus
  featured: boolean
  batches: TicketBatchInput[]
}
