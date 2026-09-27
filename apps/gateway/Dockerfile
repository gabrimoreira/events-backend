# nginx gateway: builds the frontend and routes /api/* to the services.
# The frontend repository comes in as the `frontend` build context:
#   docker build --build-context frontend=../events-frontend -f apps/gateway/Dockerfile .

FROM node:22-alpine AS web
WORKDIR /web
COPY --from=frontend package.json package-lock.json ./
RUN npm ci
COPY --from=frontend index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY --from=frontend public ./public
COPY --from=frontend src ./src
# Absolute URL: the frontend's apiClient builds requests with `new URL(...)`.
ARG VITE_API_URL=http://localhost:3000/api
ENV VITE_API_URL=$VITE_API_URL \
    VITE_USE_MOCKS=false
RUN npm run build

FROM nginx:1.29-alpine
ENV AUTH_SERVICE_URL=http://auth-service:3001 \
    CATALOG_SERVICE_URL=http://catalog-service:3002 \
    SALES_SERVICE_URL=http://sales-service:3003
COPY apps/gateway/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=web /web/dist /usr/share/nginx/html
