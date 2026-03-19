"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { presets, type Preset } from "./presets";
import { compileMarkdownToHtml } from "./compiler";
import { savePresentation } from "./actions";
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

export function SlideEditor() {
  const router = useRouter();
  const [title, setTitle] = useState("Ma Présentation");
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN);
  const [selectedPreset, setSelectedPreset] = useState<Preset>(presets[0]);
  const [saving, setSaving] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiProvider, setAiProvider] = useState<AiProvider>("claude");
  const [generating, setGenerating] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const html = useMemo(
    () => compileMarkdownToHtml(markdown, selectedPreset, title),
    [markdown, selectedPreset, title]
  );

  const slideCount = useMemo(
    () => markdown.split(/^---\s*$/m).filter((s) => s.trim()).length,
    [markdown]
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    const result = await savePresentation({ title, html });
    setSaving(false);

    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success("Présentation sauvegardée !");
      router.push("/dashboard");
    }
  }, [title, html, router]);

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
        <span className="text-xs text-muted-foreground">{slideCount} slide(s)</span>
        <div className="ml-auto flex items-center gap-2">
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? "Sauvegarde..." : "Publier"}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Editor panel */}
        <div className="flex w-[420px] flex-col border-r">
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

          {/* Markdown editor */}
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
        </div>

        {/* Right: Live preview */}
        <div className="flex-1 bg-muted/20">
          <iframe
            ref={iframeRef}
            srcDoc={html}
            title="Preview"
            className="h-full w-full border-0"
            sandbox="allow-scripts"
          />
        </div>
      </div>
    </div>
  );
}
