import { PutObjectCommand } from '@aws-sdk/client-s3'
import type { OrderPaidMessage } from '@eventflow/shared/types'

import { env } from '@/config/env'
import { OUTPUT } from '@/constants'
import type { WorkerContext } from '@/context'
import { prepareBanner, renderTicketPdf } from '@/pdf/ticketPdf'

function bannerSource(event: { bannerUrl: string; bannerVariants: unknown }): string {
  const variants = event.bannerVariants as { hero?: string } | null
  return variants?.hero ?? event.bannerUrl
}

export async function handleOrderPaid(
  message: OrderPaidMessage,
  { db, s3, audit, logger }: WorkerContext,
) {
  const tickets = await db.ticket.findMany({
    where: { id: { in: message.ticketIds }, status: 'processing' },
    include: {
      event: {
        select: {
          title: true,
          category: true,
          startsAt: true,
          venueName: true,
          venueAddress: true,
          venueCity: true,
          venueState: true,
          bannerUrl: true,
          bannerVariants: true,
        },
      },
      batch: { select: { name: true } },
      order: { select: { number: true } },
    },
  })
  if (tickets.length === 0) {
    logger.info({ orderId: message.orderId }, 'ORDER_PAID: no tickets pending, skipping')
    return
  }

  const banner = await prepareBanner(bannerSource(tickets[0]!.event))

  for (const ticket of tickets) {
    const pdf = await renderTicketPdf({
      id: ticket.id,
      code: ticket.code,
      holderName: ticket.holderName,
      holderEmail: ticket.holderEmail,
      price: ticket.price.toNumber(),
      batchName: ticket.batch.name,
      orderNumber: ticket.order.number,
      issuedAt: ticket.issuedAt,
      event: ticket.event,
      banner,
    })
    const key = `${OUTPUT.ticketPdfPrefix}/${ticket.orderId}/${ticket.id}.pdf`
    await s3.send(
      new PutObjectCommand({
        Bucket: env.s3Bucket,
        Key: key,
        Body: pdf,
        ContentType: 'application/pdf',
      }),
    )
    const { count } = await db.ticket.updateMany({
      where: { id: ticket.id, status: 'processing' },
      data: { status: 'valid', pdfKey: key },
    })
    if (count > 0) {
      await audit.log({
        action: 'UPDATE',
        entity: 'TICKET',
        entityId: ticket.id,
        data: { orderId: ticket.orderId, status: 'valid', pdfKey: key, bytes: pdf.length },
      })
    }
  }

  logger.info({ orderId: message.orderId, tickets: tickets.length }, 'ticket PDFs issued')
}
