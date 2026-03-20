#!/bin/sh
set -e

echo "[Entrypoint] Ensuring data directory exists..."
mkdir -p /app/data

echo "[Entrypoint] Pushing Drizzle schema to database..."
cd /app
node drizzle-cli/node_modules/drizzle-kit/bin.cjs push --config=drizzle-cli/drizzle.config.ts

echo "[Entrypoint] Starting Next.js server..."
exec node server.js
