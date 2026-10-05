import { pino, type Logger } from 'pino'

export type { Logger }

interface LoggerOptions {
  level?: string
  pretty?: boolean
}

export function createLogger(
  service: string,
  { level = 'info', pretty = false }: LoggerOptions = {},
) {
  return pino({
    name: service,
    level,
    transport: pretty
      ? {
          target: 'pino-pretty',
          options: { translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' },
        }
      : undefined,
  })
}
