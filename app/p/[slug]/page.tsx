import { db } from "@/lib/db";
import { presentation } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Download } from "lucide-react";

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

  return { title: `${result[0].title} — Slides Composer` };
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
    <div className="relative h-screen w-screen">
      <iframe
        srcDoc={result[0].html}
        title={result[0].title}
        className="h-full w-full border-0"
        sandbox="allow-scripts allow-same-origin"
      />
      <a
        href={`/api/download/public/${slug}`}
        download
        className="fixed bottom-4 right-4 flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-sm text-white shadow-lg backdrop-blur-sm transition-opacity hover:bg-black/90"
      >
        <Download className="h-4 w-4" />
        Télécharger
      </a>
    </div>
  );
}
