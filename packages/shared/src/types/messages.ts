export interface OrderPaidMessage {
  type: 'ORDER_PAID'
  orderId: string
  ticketIds: string[]
  occurredAt: string
}

export interface BannerUploadedMessage {
  type: 'BANNER_UPLOADED'
  eventId: string
  key: string
  occurredAt: string
}

export type DomainMessage = OrderPaidMessage | BannerUploadedMessage

export type DomainMessageType = DomainMessage['type']
