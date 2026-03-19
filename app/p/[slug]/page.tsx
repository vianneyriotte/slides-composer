import { db } from "@/lib/db";
import { presentation } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await db
    .select({ title: presentation.title })
    .from(presentation)
    .where(eq(presentation.slug, slug))
    .limit(1);

  if (!result[0]) return { title: "Présentation introuvable" };

  return { title: `${result[0].title} — Slide Composer` };
}

export default async function PresentationPage({ params }: Props) {
  const { slug } = await params;

  const result = await db
    .select({ html: presentation.html, title: presentation.title, isPublic: presentation.isPublic })
    .from(presentation)
    .where(eq(presentation.slug, slug))
    .limit(1);

  if (!result[0] || !result[0].isPublic) notFound();

  return (
    <iframe
      srcDoc={result[0].html}
      title={result[0].title}
      className="h-screen w-screen border-0"
      sandbox="allow-scripts allow-same-origin"
    />
  );
}
