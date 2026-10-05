import { consumeQueue, resolveQueueUrl } from '@eventflow/shared/messaging'
import { onShutdown } from '@eventflow/shared/utils'

import { env } from '@/config/env'
import { SERVICE_NAME } from '@/constants'
import { createContext } from '@/context'
import { dispatch } from '@/handlers'

const context = createContext()
const { logger, sqs } = context
const controller = new AbortController()

const consumers = Promise.all(
  Object.values(env.queues).map(async (queueName) =>
    consumeQueue({
      client: sqs,
      queueUrl: await resolveQueueUrl(sqs, queueName),
      logger: logger.child({ queue: queueName }),
      handle: (message) => dispatch(message, context),
      signal: controller.signal,
    }),
  ),
)

logger.info(`${SERVICE_NAME} started`)

consumers.catch((error: unknown) => {
  logger.fatal({ err: error }, 'consumer crashed')
  process.exit(1)
})

onShutdown(logger, async () => {
  controller.abort()
  await consumers
  await Promise.all([context.db.$disconnect(), context.redis.quit()])
})
