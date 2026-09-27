import { config } from 'dotenv'
import { defineConfig } from 'prisma/config'

// Same .env as the services (repository root). Already-set variables win.
config({ path: '../../.env', quiet: true })

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed/index.ts',
  },
  datasource: {
    // Not required to generate the client, only to talk to the database.
    url: process.env.DATABASE_URL ?? '',
  },
})
