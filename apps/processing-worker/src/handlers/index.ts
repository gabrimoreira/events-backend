import type { DomainMessage } from '@eventflow/shared/types'

import type { WorkerContext } from '@/context'

import { handleBannerUploaded } from './bannerResize.handler'
import { handleOrderPaid } from './ticketPdf.handler'

export function dispatch(message: DomainMessage, context: WorkerContext): Promise<void> {
  switch (message.type) {
    case 'ORDER_PAID':
      return handleOrderPaid(message, context)
    case 'BANNER_UPLOADED':
      return handleBannerUploaded(message, context)
  }
}
