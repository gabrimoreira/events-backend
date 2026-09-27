import type { TicketBatch as BatchRecord } from '@eventflow/db'
import type { Event, TicketBatch } from '@eventflow/shared/types'

import type { EventWithBatches } from '@/repositories/events.repository'

export function toTicketBatch(record: BatchRecord): TicketBatch {
  return {
    id: record.id,
    name: record.name,
    description: record.description ?? undefined,
    price: record.price.toNumber(),
    quantity: record.quantity,
    sold: record.sold,
    startsAt: record.startsAt.toISOString(),
    endsAt: record.endsAt.toISOString(),
  }
}

/** Database row → API contract (events-frontend/src/types/event.ts). */
export function toEvent(record: EventWithBatches): Event {
  return {
    id: record.id,
    title: record.title,
    summary: record.summary,
    description: record.description,
    category: record.category,
    startsAt: record.startsAt.toISOString(),
    endsAt: record.endsAt.toISOString(),
    venue: {
      name: record.venueName,
      address: record.venueAddress,
      city: record.venueCity,
      state: record.venueState,
    },
    bannerUrl: record.bannerUrl,
    organizer: {
      name: record.organizerName,
      verified: record.organizerVerified,
      eventsCount: record.organizerEventsCount,
    },
    batches: record.batches.map(toTicketBatch),
    status: record.status,
    featured: record.featured,
    tags: record.tags,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}
