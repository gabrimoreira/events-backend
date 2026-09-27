import { onShutdown } from '@eventflow/shared/utils'

import { createApp } from '@/app/createApp'
import { createContext } from '@/app/context'
import { env } from '@/config/env'
import { SERVICE_NAME } from '@/constants'

const context = createContext()

const server = createApp(context).listen(env.port, () => {
  context.logger.info({ port: env.port }, `${SERVICE_NAME} listening`)
})

onShutdown(context.logger, async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()))
  await Promise.all([context.db.$disconnect(), context.redis.quit()])
})
