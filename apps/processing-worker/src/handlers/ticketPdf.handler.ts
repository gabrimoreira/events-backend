import type { OrderPaidMessage } from '@eventflow/shared/types'

import type { WorkerContext } from '@/context'

/**
 * ORDER_PAID → for each ticket still `processing`: generate the QR code (ticket code)
 * and the PDF, upload to S3 (OUTPUT.ticketPdfPrefix), set `pdf_key` and status `valid`,
 * log TICKET UPDATE. Idempotent: tickets already `valid` are skipped (SQS may redeliver).
 */
export async function handleOrderPaid(message: OrderPaidMessage, { logger }: WorkerContext) {
  logger.warn(
    { orderId: message.orderId, tickets: message.ticketIds.length },
    'ORDER_PAID received — ticket PDF generation not implemented yet',
  )
}
