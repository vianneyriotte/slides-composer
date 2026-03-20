#!/bin/sh
set -e

echo "[Entrypoint] Ensuring data directory exists..."
mkdir -p /app/data

echo "[Entrypoint] DATABASE_URL=$DATABASE_URL"

echo "[Entrypoint] Pushing Drizzle schema to database..."
cd /app
echo "Yes" | node drizzle-cli/node_modules/drizzle-kit/bin.cjs push --config=drizzle.config.ts || {
  echo "[Entrypoint] WARNING: drizzle-kit push failed, starting anyway..."
}

echo "[Entrypoint] Starting Next.js server..."
exec node server.js
