import { db } from "@/lib/db";
import { presentation } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const result = await db
    .select({
      html: presentation.html,
      title: presentation.title,
      isPublic: presentation.isPublic,
    })
    .from(presentation)
    .where(eq(presentation.slug, slug))
    .limit(1);

  if (!result[0] || !result[0].isPublic) {
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
