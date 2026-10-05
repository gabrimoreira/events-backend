import type { Logger } from './logger'

export function onShutdown(logger: Logger, cleanup: () => Promise<void>): void {
  let stopping = false
  const stop = async (signal: NodeJS.Signals) => {
    if (stopping) return
    stopping = true
    logger.info({ signal }, 'shutting down')
    try {
      await cleanup()
      process.exit(0)
    } catch (error) {
      logger.error({ err: error }, 'shutdown failed')
      process.exit(1)
    }
  }
  process.once('SIGTERM', stop)
  process.once('SIGINT', stop)
}
