# syntax=docker/dockerfile:1
FROM node:22-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=secret,id=npm_ca \
  if [ -f /run/secrets/npm_ca ]; then \
    export NODE_EXTRA_CA_CERTS=/run/secrets/npm_ca; \
  fi; \
  npm ci --no-audit --no-fund

COPY . .
RUN npm run build

FROM caddy:2-alpine

COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv/pwa

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1
