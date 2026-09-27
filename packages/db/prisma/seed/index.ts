import { randomUUID } from 'node:crypto'

import bcrypt from 'bcryptjs'

import { createDbClient } from '../../src'

import { createMockEvents } from './events'
import { createMockOrdersAndTickets } from './orders'
import { createMockUsers } from './users'
import { DEMO_CREDENTIALS } from './utils'

/**
 * Loads the same demo data the frontend mocks use (dates relative to today).
 * Idempotent: wipes the tables first. Run with `npm run db:seed`.
 */
const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is not set')

const db = createDbClient(databaseUrl)

const passwords: Record<string, string> = {
  [DEMO_CREDENTIALS.customer.email]: DEMO_CREDENTIALS.customer.password,
  [DEMO_CREDENTIALS.admin.email]: DEMO_CREDENTIALS.admin.password,
}

async function main() {
  const users = createMockUsers()
  const events = createMockEvents()
  const { orders, tickets } = createMockOrdersAndTickets(events, users)

  await db.$transaction([
    db.ticket.deleteMany(),
    db.orderItem.deleteMany(),
    db.order.deleteMany(),
    db.ticketBatch.deleteMany(),
    db.event.deleteMany(),
    db.user.deleteMany(),
  ])

  await db.user.createMany({
    data: await Promise.all(
      users.map(async ({ avatarUrl, ...user }) => ({
        ...user,
        avatarUrl: avatarUrl ?? null,
        // Only the demo accounts can log in; the others exist to own seeded orders.
        passwordHash: await bcrypt.hash(passwords[user.email] ?? randomUUID(), 10),
      })),
    ),
  })

  await db.event.createMany({
    data: events.map(({ venue, organizer, batches: _batches, ...event }) => ({
      ...event,
      venueName: venue.name,
      venueAddress: venue.address,
      venueCity: venue.city,
      venueState: venue.state,
      organizerName: organizer.name,
      organizerVerified: organizer.verified,
      organizerEventsCount: organizer.eventsCount,
    })),
  })

  await db.ticketBatch.createMany({
    data: events.flatMap((event) =>
      event.batches.map((batch, position) => ({ ...batch, eventId: event.id, position })),
    ),
  })

  await db.order.createMany({
    data: orders.map(({ items: _items, payment, number, ...order }) => ({
      ...order,
      number: Number(number.slice(3)),
      paymentMethod: payment.method,
      paymentStatus: payment.status,
      cardLast4: payment.cardLast4 ?? null,
      installments: payment.installments ?? null,
      paidAt: payment.paidAt ?? null,
    })),
  })

  await db.orderItem.createMany({
    data: orders.flatMap((order) =>
      order.items.map((item, index) => ({
        ...item,
        id: `${order.id}_i${index + 1}`,
        orderId: order.id,
      })),
    ),
  })

  const ownerByOrder = new Map(orders.map((order) => [order.id, order.customerId]))
  await db.ticket.createMany({
    data: tickets.map((ticket) => ({
      id: ticket.id,
      code: ticket.code,
      orderId: ticket.orderId,
      ownerId: ownerByOrder.get(ticket.orderId)!,
      eventId: ticket.eventId,
      batchId: ticket.batchId,
      holderName: ticket.holderName,
      holderEmail: ticket.holderEmail,
      price: ticket.price,
      status: ticket.status,
      issuedAt: ticket.issuedAt,
    })),
  })

  // Seeded orders use explicit numbers; continue the sequence after them.
  await db.$executeRaw`SELECT setval(pg_get_serial_sequence('orders', 'number'), (SELECT MAX(number) FROM orders))`

  console.log(
    `Seeded ${users.length} users, ${events.length} events, ${orders.length} orders, ${tickets.length} tickets.`,
  )
}

main()
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => db.$disconnect())
