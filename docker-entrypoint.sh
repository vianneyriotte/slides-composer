#!/bin/sh
set -e

echo "[Entrypoint] Pushing Drizzle schema to database..."
cd /app/drizzle-cli && node node_modules/drizzle-kit/bin.cjs push

echo "[Entrypoint] Starting Next.js server..."
cd /app
exec node server.js
