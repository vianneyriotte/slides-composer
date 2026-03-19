"use server";

import { db } from "@/lib/db";
import { presentation } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth/session";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

export async function savePresentation(data: {
  title: string;
  html: string;
  markdown?: string;
  presetId?: string;
}) {
  const session = await requireSession();
  const id = randomUUID();
  const now = new Date();
  const slug = `${slugify(data.title)}-${id.slice(0, 8)}`;

  try {
    await db.insert(presentation).values({
      id,
      title: data.title,
      slug,
      html: data.html,
      markdown: data.markdown ?? null,
      presetId: data.presetId ?? null,
      userId: session.user.id,
      isPublic: true,
      createdAt: now,
      updatedAt: now,
    });

    return { slug };
  } catch {
    return { error: "Erreur lors de la sauvegarde" };
  }
}

export async function updatePresentation(data: {
  id: string;
  title: string;
  html: string;
  markdown?: string;
  presetId?: string;
}) {
  const session = await requireSession();
  const now = new Date();

  try {
    await db
      .update(presentation)
      .set({
        title: data.title,
        html: data.html,
        markdown: data.markdown ?? null,
        presetId: data.presetId ?? null,
        updatedAt: now,
      })
      .where(and(eq(presentation.id, data.id), eq(presentation.userId, session.user.id)));

    return { success: true };
  } catch {
    return { error: "Erreur lors de la mise à jour" };
  }
}

export async function getPresentation(id: string) {
  const session = await requireSession();

  const result = await db
    .select()
    .from(presentation)
    .where(and(eq(presentation.id, id), eq(presentation.userId, session.user.id)))
    .limit(1);

  return result[0] ?? null;
}
