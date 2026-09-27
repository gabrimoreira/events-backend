import { defineConfig } from 'tsup'

/**
 * Bundles the service with the workspace packages (@eventflow/*), which ship as
 * TypeScript source. Everything from node_modules stays external.
 */
export default defineConfig({
  entry: ['src/main.ts'],
  format: 'esm',
  platform: 'node',
  target: 'node22',
  clean: true,
  sourcemap: true,
  skipNodeModulesBundle: true,
  noExternal: [/^@eventflow\//],
})
