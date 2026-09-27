/**
 * Messages published to the SNS topic and delivered to the worker queues.
 * `type` is also sent as an SNS message attribute — the subscription filter
 * policies use it to route each message to the right SQS queue.
 */
export interface OrderPaidMessage {
  type: 'ORDER_PAID'
  orderId: string
  ticketIds: string[]
  occurredAt: string
}

export interface BannerUploadedMessage {
  type: 'BANNER_UPLOADED'
  eventId: string
  /** S3 key of the original upload. */
  key: string
  occurredAt: string
}

export type DomainMessage = OrderPaidMessage | BannerUploadedMessage

export type DomainMessageType = DomainMessage['type']
