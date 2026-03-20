#!/bin/sh
set -e

echo "[Entrypoint] Ensuring data directory exists..."
mkdir -p /app/data

echo "[Entrypoint] Running database migrations..."
NODE_PATH=/app/migrate_modules node /app/scripts/migrate.mjs

echo "[Entrypoint] Starting Next.js server..."
exec node server.js
