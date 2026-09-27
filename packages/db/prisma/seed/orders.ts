import type { Event, Order, OrderStatus, Ticket, User } from '@eventflow/shared/types'

import { createRandom, daysFromNow, isEventPast, orderTotals } from './utils'

export function ticketCode(orderNumber: string, index: number) {
  return `${orderNumber.replace('EF-', 'TK-')}-${String(index + 1).padStart(2, '0')}`
}

export function buildTickets(
  order: Order,
  event: Event,
  holder: Pick<User, 'name' | 'email'>,
): Ticket[] {
  const past = isEventPast(event)
  const status: Ticket['status'] =
    order.status === 'cancelled' ? 'cancelled' : past ? 'used' : 'valid'

  let counter = 0
  return order.items.flatMap((item) =>
    Array.from({ length: item.quantity }, () => {
      const index = counter++
      return {
        id: `tkt_${order.id.slice(4)}_${index + 1}`,
        code: ticketCode(order.number, index),
        orderId: order.id,
        eventId: event.id,
        eventTitle: event.title,
        eventStartsAt: event.startsAt,
        eventBannerUrl: event.bannerUrl,
        eventCategory: event.category,
        venueName: event.venue.name,
        venueCity: `${event.venue.city}, ${event.venue.state}`,
        batchId: item.batchId,
        batchName: item.batchName,
        holderName: holder.name,
        holderEmail: holder.email,
        price: item.unitPrice,
        status,
        issuedAt: order.createdAt,
      }
    }),
  )
}

interface DemoOrderSeed {
  eventId: string
  batchIndex: number
  quantity: number
  daysAgo: number
}

/** Orders that guarantee the demo customer has upcoming and past tickets. */
const DEMO_CUSTOMER_ORDERS: DemoOrderSeed[] = [
  { eventId: 'evt_rock-festival', batchIndex: 2, quantity: 1, daysAgo: 9 },
  { eventId: 'evt_tech-summit', batchIndex: 1, quantity: 1, daysAgo: 14 },
  { eventId: 'evt_cinema-open-air', batchIndex: 1, quantity: 2, daysAgo: 3 },
  { eventId: 'evt_summer-beats', batchIndex: 0, quantity: 2, daysAgo: 52 },
  { eventId: 'evt_hackathon', batchIndex: 0, quantity: 1, daysAgo: 30 },
]

const STATUS_WEIGHTS: [OrderStatus, number][] = [
  ['paid', 0.8],
  ['pending', 0.12],
  ['cancelled', 0.08],
]

export function createMockOrdersAndTickets(events: Event[], users: User[]) {
  const random = createRandom(2026)
  const customers = users.filter((user) => user.role === 'customer')
  const sellable = events.filter((event) => event.status !== 'draft')
  const demoCustomer = customers[0]!

  const orders: Order[] = []
  const tickets: Ticket[] = []
  let sequence = 1041

  const pickStatus = (): OrderStatus => {
    const roll = random.next()
    let acc = 0
    for (const [status, weight] of STATUS_WEIGHTS) {
      acc += weight
      if (roll <= acc) return status
    }
    return 'paid'
  }

  const register = (
    event: Event,
    customer: User,
    batchIndex: number,
    quantity: number,
    daysAgo: number,
    status: OrderStatus,
  ) => {
    const batch = event.batches[Math.min(batchIndex, event.batches.length - 1)]!
    const number = `EF-${sequence++}`
    const createdAt = daysFromNow(
      -daysAgo,
      `${String(random.int(8, 22)).padStart(2, '0')}:${String(random.int(0, 59)).padStart(2, '0')}`,
    )
    const totals = orderTotals(batch.price * quantity)
    const order: Order = {
      id: `ord_${number.slice(3)}`,
      number,
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      eventId: event.id,
      eventTitle: event.title,
      items: [{ batchId: batch.id, batchName: batch.name, unitPrice: batch.price, quantity }],
      ...totals,
      payment: {
        method: random.next() > 0.45 ? 'card' : 'pix',
        status,
        cardLast4: String(random.int(1000, 9999)),
        installments: 1,
        paidAt: status === 'paid' ? createdAt : undefined,
      },
      status,
      createdAt,
    }
    if (order.payment.method === 'pix') delete order.payment.cardLast4
    orders.push(order)
    if (status !== 'pending') tickets.push(...buildTickets(order, event, customer))
  }

  for (const seed of DEMO_CUSTOMER_ORDERS) {
    const event = sellable.find((item) => item.id === seed.eventId)
    if (event) register(event, demoCustomer, seed.batchIndex, seed.quantity, seed.daysAgo, 'paid')
  }

  for (let index = 0; index < 54; index++) {
    const event = random.pick(sellable)
    const customer = random.pick(customers.slice(1))
    const daysAgo = isEventPast(event) ? random.int(45, 80) : random.int(0, 20)
    register(
      event,
      customer,
      random.int(0, event.batches.length - 1),
      random.int(1, 4),
      daysAgo,
      pickStatus(),
    )
  }

  orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return { orders, tickets }
}
