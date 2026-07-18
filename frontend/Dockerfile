# ─────────────────────────────────────────────────────────────────────────────
# Stage 1: Builder — Install deps and compile the React app
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --frozen-lockfile

# Copy source code
COPY . .

# Build production bundle
RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: Production — Serve via nginx:alpine
# ─────────────────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS production

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD wget -qO- http://localhost:80/health.txt || exit 1

# Create a simple health check file
RUN echo "ok" > /usr/share/nginx/html/health.txt

EXPOSE 80

# Run as non-root user for security
RUN addgroup -g 1001 -S nginx_app && \
    adduser -S -D -H -u 1001 -G nginx_app nginx_app && \
    chown -R nginx_app:nginx_app /usr/share/nginx/html && \
    chown -R nginx_app:nginx_app /var/cache/nginx && \
    chown -R nginx_app:nginx_app /var/log/nginx

CMD ["nginx", "-g", "daemon off;"]
