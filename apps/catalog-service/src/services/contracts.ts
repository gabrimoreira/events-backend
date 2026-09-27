import type { AuthUser } from '@eventflow/shared/http'
import type { Event, EventInput, EventQuery, Paginated } from '@eventflow/shared/types'

/**
 * Same operations as EventsService in events-frontend/src/services/contracts.ts.
 * `actor` is the authenticated user: optional on reads (admins also see drafts),
 * required on writes (admin only, enforced by the routes).
 */
export interface EventsService {
  getEvents(query: EventQuery, actor?: AuthUser): Promise<Paginated<Event>>
  getEventById(id: string, actor?: AuthUser): Promise<Event>
  getEventCities(): Promise<string[]>
  createEvent(input: EventInput, actor: AuthUser): Promise<Event>
  updateEvent(id: string, input: EventInput, actor: AuthUser): Promise<Event>
  deleteEvent(id: string, actor: AuthUser): Promise<void>
}
