"use server";

import { db } from "@/lib/db";
import { apiKey } from "@/lib/db/schema";
import type { AiProvider } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth/session";
import { encrypt, decrypt } from "@/lib/crypto";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function getApiKeys() {
  const session = await requireSession();

  const keys = await db
    .select({
      id: apiKey.id,
      provider: apiKey.provider,
      encryptedKey: apiKey.encryptedKey,
      updatedAt: apiKey.updatedAt,
    })
    .from(apiKey)
    .where(eq(apiKey.userId, session.user.id));

  return keys.map((k) => {
    const decrypted = decrypt(k.encryptedKey);
    // Mask the key: show first 8 chars + ...
    const masked = decrypted.slice(0, 8) + "..." + decrypted.slice(-4);
    return {
      id: k.id,
      provider: k.provider as AiProvider,
      maskedKey: masked,
      updatedAt: k.updatedAt,
    };
  });
}

export async function saveApiKey(provider: AiProvider, key: string) {
  const session = await requireSession();

  if (!key.trim()) {
    return { error: "Clé API requise" };
  }

  const encrypted = encrypt(key.trim());
  const now = new Date();

  // Upsert: delete existing key for this provider, then insert
  await db
    .delete(apiKey)
    .where(and(eq(apiKey.userId, session.user.id), eq(apiKey.provider, provider)));

  await db.insert(apiKey).values({
    id: randomUUID(),
    userId: session.user.id,
    provider,
    encryptedKey: encrypted,
    createdAt: now,
    updatedAt: now,
  });

  return { success: true };
}

export async function deleteApiKey(provider: AiProvider) {
  const session = await requireSession();

  await db
    .delete(apiKey)
    .where(and(eq(apiKey.userId, session.user.id), eq(apiKey.provider, provider)));

  return { success: true };
}
