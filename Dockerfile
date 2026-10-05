FROM node:22-alpine AS build
WORKDIR /repo
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/db/package.json packages/db/prisma.config.ts packages/db/
COPY packages/db/prisma packages/db/prisma
COPY apps/auth-service/package.json apps/auth-service/
COPY apps/catalog-service/package.json apps/catalog-service/
COPY apps/sales-service/package.json apps/sales-service/
COPY apps/processing-worker/package.json apps/processing-worker/
RUN npm ci
COPY . .
ARG APP
RUN test -n "$APP" && npm run build -w "apps/$APP"

FROM build AS migrate
CMD ["npm", "run", "migrate:deploy", "-w", "@eventflow/db"]

FROM build AS prune
RUN npm prune --omit=dev

FROM node:22-alpine
ARG APP
ENV NODE_ENV=production
WORKDIR /app
COPY --from=prune /repo/node_modules ./node_modules
COPY --from=build /repo/apps/$APP/dist ./dist
USER node
CMD ["node", "--enable-source-maps", "dist/main.js"]
