# syntax=docker/dockerfile:1.7

# ---- Builder: compile the Vite SPA with the same-origin API base ----
FROM node:22.21.0-alpine3.21 AS builder

WORKDIR /app

# Resolve dependencies before copying sources so this layer is cached
# while only application code changes.
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

COPY . .

# The browser reaches the API on the same origin, under /api, proxied
# by nginx at runtime. Baked once here as a build-time constant.
ENV VITE_API_URL=/api
RUN npm run build

# ---- Runtime: unprivileged nginx serving the static build ----
FROM nginxinc/nginx-unprivileged:1.27.5-alpine AS runtime

# Default upstream for compose; overridable at runtime for standalone use.
ENV API_UPSTREAM=http://back-end:8080
# Expose the host's nameservers to templates as ${NGINX_LOCAL_RESOLVERS}
# (base image entrypoint 15-local-resolvers.envsh) so the proxy can resolve
# the upstream at request time instead of at config load.
ENV NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1
# Substitute only our two variables; leave nginx runtime $vars untouched.
ENV NGINX_ENVSUBST_FILTER="API_UPSTREAM|NGINX_LOCAL_RESOLVERS"

# The base image renders /etc/nginx/templates/*.template into conf.d at start.
COPY docker/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --spider http://127.0.0.1:8080/ || exit 1

LABEL org.opencontainers.image.source="https://github.com/projeto-doceterapia/front-end" \
      org.opencontainers.image.title="doceterapia-front-end" \
      org.opencontainers.image.description="Doceterapia web app served by nginx with an /api reverse proxy"
