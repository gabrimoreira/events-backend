import { Router } from 'express'

export type HealthCheck = () => Promise<unknown>

const TIMEOUT_MS = 2_000

async function run(check: HealthCheck): Promise<string> {
  try {
    await Promise.race([
      check(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), TIMEOUT_MS)),
    ])
    return 'ok'
  } catch (error) {
    return error instanceof Error ? error.message : 'error'
  }
}

export function healthRouter(service: string, checks: Record<string, HealthCheck>): Router {
  const router = Router()
  router.get('/health', async (_req, res) => {
    const entries = await Promise.all(
      Object.entries(checks).map(async ([name, check]) => [name, await run(check)] as const),
    )
    const healthy = entries.every(([, status]) => status === 'ok')
    res
      .status(healthy ? 200 : 503)
      .json({ status: healthy ? 'ok' : 'error', service, checks: Object.fromEntries(entries) })
  })
  return router
}
