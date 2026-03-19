"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { presets, type Preset } from "./presets";
import { compileMarkdownToHtml } from "./compiler";
import { savePresentation, updatePresentation } from "./actions";
import { PROVIDER_INFO } from "@/lib/ai/providers";
import type { AiProvider } from "@/lib/db/schema";

const DEFAULT_MARKDOWN = `# Ma Présentation
Sous-titre ici
---
## Premier slide
- Point important numéro 1
- Point important numéro 2
- Point important numéro 3
---
## Exemple de code
\`\`\`bash
echo "Hello World"
\`\`\`
`;

type EditorProps = {
  mode?: "create" | "edit-markdown" | "edit-html";
  initialData?: {
    id: string;
    title: string;
    markdown?: string | null;
    presetId?: string | null;
    html: string;
  };
};

export function SlideEditor({ mode = "create", initialData }: EditorProps) {
  const router = useRouter();
  const isEditMode = mode !== "create";
  const isHtmlMode = mode === "edit-html";

  const initialPreset = initialData?.presetId
    ? presets.find((p) => p.id === initialData.presetId) ?? presets[0]
    : presets[0];

  const [title, setTitle] = useState(initialData?.title ?? "Ma Présentation");
  const [markdown, setMarkdown] = useState(initialData?.markdown ?? DEFAULT_MARKDOWN);
  const [rawHtml, setRawHtml] = useState(initialData?.html ?? "");
  const [selectedPreset, setSelectedPreset] = useState<Preset>(initialPreset);
  const [saving, setSaving] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiProvider, setAiProvider] = useState<AiProvider>("claude");
  const [generating, setGenerating] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const compiledHtml = useMemo(
    () => (isHtmlMode ? rawHtml : compileMarkdownToHtml(markdown, selectedPreset, title)),
    [isHtmlMode, rawHtml, markdown, selectedPreset, title]
  );

  const slideCount = useMemo(
    () => (isHtmlMode ? null : markdown.split(/^---\s*$/m).filter((s) => s.trim()).length),
    [isHtmlMode, markdown]
  );

  const handleSave = useCallback(async () => {
    setSaving(true);

    let result;
    if (isEditMode && initialData) {
      result = await updatePresentation({
        id: initialData.id,
        title,
        html: compiledHtml,
        markdown: isHtmlMode ? undefined : markdown,
        presetId: isHtmlMode ? undefined : selectedPreset.id,
      });
    } else {
      result = await savePresentation({
        title,
        html: compiledHtml,
        markdown,
        presetId: selectedPreset.id,
      });
    }

    setSaving(false);

    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success(isEditMode ? "Mis à jour !" : "Publié !");
      router.push("/dashboard");
      router.refresh();
    }
  }, [title, compiledHtml, markdown, selectedPreset, isEditMode, isHtmlMode, initialData, router]);

  const handleGenerate = useCallback(async () => {
    if (!aiPrompt.trim()) return;
    setGenerating(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt, provider: aiProvider }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Erreur lors de la génération");
        setGenerating(false);
        return;
      }

      const data = await res.json();
      setMarkdown(data.markdown);
      setTitle(data.title || aiPrompt.slice(0, 50));
      toast.success("Contenu généré !");
    } catch {
      toast.error("Erreur réseau");
    }

    setGenerating(false);
  }, [aiPrompt, aiProvider]);

  return (
    <div className="flex h-screen flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b px-4 py-2">
        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
          ← Retour
        </Button>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="max-w-xs"
          placeholder="Titre de la présentation"
        />
        {slideCount !== null && (
          <span className="text-xs text-muted-foreground">{slideCount} slide(s)</span>
        )}
        {isHtmlMode && (
          <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">HTML</span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? "Sauvegarde..." : isEditMode ? "Mettre à jour" : "Publier"}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Editor panel */}
        <div className="flex w-[420px] flex-col border-r">
          {!isHtmlMode && (
            <>
              {/* AI Generator */}
              <div className="border-b p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">Générer avec l&apos;IA</p>
                  <Link href="/dashboard/settings" className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">
                    Clés API
                  </Link>
                </div>
                <div className="mb-2 flex gap-1">
                  {(Object.keys(PROVIDER_INFO) as AiProvider[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setAiProvider(p)}
                      className={`rounded-md border px-2 py-0.5 text-xs transition-colors ${
                        aiProvider === p
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      {PROVIDER_INFO[p].name.split(" ")[0]}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Ex: Les bases de Docker..."
                    onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                    className="text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleGenerate}
                    disabled={generating || !aiPrompt.trim()}
                  >
                    {generating ? "..." : "Générer"}
                  </Button>
                </div>
              </div>

              {/* Preset selector */}
              <div className="border-b p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Style</p>
                <div className="flex flex-wrap gap-1.5">
                  {presets.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPreset(p)}
                      className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-colors ${
                        selectedPreset.id === p.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ background: p.colors["--accent"] }}
                      />
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Editor: Markdown textarea or HTML file upload */}
          {isHtmlMode ? (
            <div className="flex flex-1 flex-col items-center justify-center p-6">
              <div
                className={`flex w-full flex-1 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                  dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  const file = e.dataTransfer.files[0];
                  if (file?.name.endsWith(".html")) {
                    file.text().then((text) => {
                      setRawHtml(text);
                      setTitle(file.name.replace(".html", ""));
                      toast.success("Fichier chargé — vérifiez la preview puis cliquez Mettre à jour");
                    });
                  } else {
                    toast.error("Seuls les fichiers .html sont acceptés");
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3 text-muted-foreground"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                <p className="text-sm font-medium">Remplacer par un nouveau fichier HTML</p>
                <p className="text-xs text-muted-foreground">Glissez-déposez ou cliquez</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".html"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file?.name.endsWith(".html")) {
                    file.text().then((text) => {
                      setRawHtml(text);
                      setTitle(file.name.replace(".html", ""));
                      toast.success("Fichier chargé — vérifiez la preview puis cliquez Mettre à jour");
                    });
                  }
                }}
              />
            </div>
          ) : (
            <div className="flex flex-1 flex-col overflow-hidden p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Markdown</p>
                <p className="text-xs text-muted-foreground">Séparez les slides avec ---</p>
              </div>
              <textarea
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                className="flex-1 resize-none rounded-md border bg-muted/30 p-3 font-mono text-sm leading-relaxed outline-none focus:ring-1 focus:ring-ring"
                spellCheck={false}
              />
            </div>
          )}
        </div>

        {/* Right: Live preview */}
        <div className="flex-1 bg-muted/20">
          <iframe
            ref={iframeRef}
            srcDoc={compiledHtml}
            title="Preview"
            className="h-full w-full border-0"
            sandbox="allow-scripts"
          />
        </div>
      </div>
    </div>
  );
}
