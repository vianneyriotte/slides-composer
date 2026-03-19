"use server";

import { db } from "@/lib/db";
import { presentation } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth/session";
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

export async function savePresentation(data: { title: string; html: string }) {
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
