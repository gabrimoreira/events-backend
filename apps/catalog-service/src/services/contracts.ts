import type { AuthUser } from '@eventflow/shared/http'
import type { Event, EventInput, EventQuery, Paginated } from '@eventflow/shared/types'

export interface EventsService {
  getEvents(query: EventQuery, actor?: AuthUser): Promise<Paginated<Event>>
  getEventById(id: string, actor?: AuthUser): Promise<Event>
  getEventCities(): Promise<string[]>
  createEvent(input: EventInput, actor: AuthUser): Promise<Event>
  updateEvent(id: string, input: EventInput, actor: AuthUser): Promise<Event>
  deleteEvent(id: string, actor: AuthUser): Promise<void>
}
