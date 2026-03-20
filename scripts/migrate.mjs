import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.DATABASE_URL ?? "file:data/local.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

const tables = [
  `CREATE TABLE IF NOT EXISTS "user" (
    "id" text PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "email" text NOT NULL,
    "email_verified" integer DEFAULT false NOT NULL,
    "image" text,
    "created_at" integer NOT NULL,
    "updated_at" integer NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "user_email_unique" ON "user" ("email")`,

  `CREATE TABLE IF NOT EXISTS "session" (
    "id" text PRIMARY KEY NOT NULL,
    "expires_at" integer NOT NULL,
    "token" text NOT NULL,
    "ip_address" text,
    "user_agent" text,
    "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "created_at" integer NOT NULL,
    "updated_at" integer NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "session_token_unique" ON "session" ("token")`,

  `CREATE TABLE IF NOT EXISTS "account" (
    "id" text PRIMARY KEY NOT NULL,
    "account_id" text NOT NULL,
    "provider_id" text NOT NULL,
    "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "access_token" text,
    "refresh_token" text,
    "id_token" text,
    "access_token_expires_at" integer,
    "refresh_token_expires_at" integer,
    "scope" text,
    "password" text,
    "created_at" integer NOT NULL,
    "updated_at" integer NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS "verification" (
    "id" text PRIMARY KEY NOT NULL,
    "identifier" text NOT NULL,
    "value" text NOT NULL,
    "expires_at" integer NOT NULL,
    "created_at" integer,
    "updated_at" integer
  )`,

  `CREATE TABLE IF NOT EXISTS "api_key" (
    "id" text PRIMARY KEY NOT NULL,
    "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "provider" text NOT NULL,
    "encrypted_key" text NOT NULL,
    "created_at" integer NOT NULL,
    "updated_at" integer NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS "presentation" (
    "id" text PRIMARY KEY NOT NULL,
    "title" text NOT NULL,
    "slug" text NOT NULL,
    "html" text NOT NULL,
    "markdown" text,
    "preset_id" text,
    "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "is_public" integer DEFAULT true NOT NULL,
    "created_at" integer NOT NULL,
    "updated_at" integer NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "presentation_slug_unique" ON "presentation" ("slug")`,
];

console.log("[migrate] Creating tables...");
for (const sql of tables) {
  await client.execute(sql);
}
console.log("[migrate] Done — all tables ready.");
client.close();
