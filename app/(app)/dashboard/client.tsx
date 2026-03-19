"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signOut } from "@/lib/auth/client";
import { toast } from "sonner";
import { uploadPresentation, deletePresentation } from "./actions";

type Presentation = {
  id: string;
  title: string;
  slug: string;
  isPublic: boolean;
  hasMarkdown: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export function DashboardClient({ presentations }: { presentations: Presentation[] }) {
  const router = useRouter();
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files) return;

    for (const file of Array.from(files)) {
      if (!file.name.endsWith(".html")) {
        toast.error(`${file.name} n'est pas un fichier HTML`);
        continue;
      }

      const html = await file.text();
      const title = file.name.replace(".html", "");

      const result = await uploadPresentation({ title, html });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`"${title}" uploadé !`);
      }
    }

    router.refresh();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Supprimer "${title}" ?`)) return;
    const result = await deletePresentation(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Supprimé");
      router.refresh();
    }
  }

  function copyLink(slug: string) {
    navigator.clipboard.writeText(`${window.location.origin}/p/${slug}`);
    toast.success("Lien copié !");
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mes présentations</h1>
          <p className="text-sm text-muted-foreground">{presentations.length} présentation(s)</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/new" className={buttonVariants({ size: "sm" })}>
            + Créer
          </Link>
          <Link href="/dashboard/settings" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Paramètres
          </Link>
          <Button variant="ghost" size="sm" onClick={() => signOut().then(() => router.push("/"))}>
            Déconnexion
          </Button>
        </div>
      </div>

      {/* Drop zone */}
      <div
        className={`mb-8 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 transition-colors ${
          dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3 text-muted-foreground"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
        <p className="text-sm font-medium">Glissez-déposez vos fichiers HTML ici</p>
        <p className="text-xs text-muted-foreground">ou cliquez pour parcourir</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".html"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Presentations grid */}
      {presentations.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          Aucune présentation. Uploadez votre premier fichier HTML !
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {presentations.map((p) => (
            <Card key={p.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{p.title}</CardTitle>
                <CardDescription className="text-xs">
                  {p.createdAt.toLocaleDateString("fr-FR")}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Link
                  href={`/dashboard/edit/${p.id}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Modifier
                </Link>
                <Button variant="outline" size="sm" onClick={() => copyLink(p.slug)}>
                  Copier le lien
                </Button>
                <Link
                  href={`/p/${p.slug}`}
                  target="_blank"
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Voir
                </Link>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(p.id, p.title)}
                >
                  Supprimer
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
