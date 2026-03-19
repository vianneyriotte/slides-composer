import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { presentation } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { DashboardClient } from "./client";

export default async function DashboardPage() {
  const session = await requireSession();

  const presentations = await db
    .select({
      id: presentation.id,
      title: presentation.title,
      slug: presentation.slug,
      isPublic: presentation.isPublic,
      createdAt: presentation.createdAt,
      updatedAt: presentation.updatedAt,
    })
    .from(presentation)
    .where(eq(presentation.userId, session.user.id))
    .orderBy(desc(presentation.createdAt));

  return <DashboardClient presentations={presentations} />;
}
