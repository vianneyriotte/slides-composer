import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { apiKey } from "@/lib/db/schema";
import type { AiProvider } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { decrypt } from "@/lib/crypto";
import { generateSlides } from "@/lib/ai/providers";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { prompt, provider } = await request.json();
  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json({ error: "Prompt requis" }, { status: 400 });
  }

  const selectedProvider = (provider ?? "claude") as AiProvider;

  // Get user's API key for this provider
  const keys = await db
    .select({ encryptedKey: apiKey.encryptedKey })
    .from(apiKey)
    .where(and(eq(apiKey.userId, session.user.id), eq(apiKey.provider, selectedProvider)))
    .limit(1);

  if (!keys[0]) {
    return NextResponse.json(
      { error: `Aucune clé API configurée pour ce provider. Allez dans Paramètres pour en ajouter une.` },
      { status: 400 }
    );
  }

  const userApiKey = decrypt(keys[0].encryptedKey);

  try {
    const text = await generateSlides(selectedProvider, userApiKey, prompt);

    const firstLine = text.split("\n")[0];
    const title = firstLine.startsWith("# ") ? firstLine.slice(2).trim() : prompt.slice(0, 50);

    return NextResponse.json({ markdown: text, title });
  } catch (err) {
    console.error("[generate] Error:", err);
    const message = err instanceof Error ? err.message : "Erreur lors de la génération";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
