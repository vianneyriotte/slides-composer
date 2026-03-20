import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { presentation } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return new Response("Non authentifié", { status: 401 });
  }

  const { id } = await params;

  const result = await db
    .select({ html: presentation.html, title: presentation.title })
    .from(presentation)
    .where(and(eq(presentation.id, id), eq(presentation.userId, session.user.id)))
    .limit(1);

  if (!result[0]) {
    return new Response("Introuvable", { status: 404 });
  }

  const filename = `${result[0].title.replace(/[^a-zA-Z0-9À-ÿ\s-]/g, "").replace(/\s+/g, "-")}.html`;

  return new Response(result[0].html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
