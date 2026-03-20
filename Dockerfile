# syntax=docker/dockerfile:1

# ================================
# Base image
# ================================
FROM node:20-slim AS base

RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# ================================
# Dependencies
# ================================
FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml* ./

# Install all dependencies + native Linux binaries for Tailwind v4
RUN pnpm install --frozen-lockfile && \
    pnpm add lightningcss-linux-x64-gnu @tailwindcss/oxide-linux-x64-gnu

# ================================
# Build stage
# ================================
FROM base AS builder
WORKDIR /app

ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV BETTER_AUTH_SECRET=build-time-secret-not-used-in-production
ENV DATABASE_URL=file:build.db

RUN pnpm build

# ================================
# Production runner
# ================================
FROM node:20-slim AS runner
WORKDIR /app

RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Copy standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Drizzle config + node_modules for db push at startup
COPY --from=builder /app/node_modules ./drizzle-cli/node_modules
COPY --from=builder /app/package.json ./drizzle-cli/
COPY --from=builder /app/drizzle.config.ts ./drizzle-cli/
COPY --from=builder /app/src/lib/db ./drizzle-cli/src/lib/db

# Create data directory for SQLite database
RUN mkdir -p data && chown nextjs:nodejs data

# Copy entrypoint
COPY --from=builder --chown=nextjs:nodejs /app/docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["./docker-entrypoint.sh"]
