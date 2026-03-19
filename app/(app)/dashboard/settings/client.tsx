"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { saveApiKey, deleteApiKey } from "./actions";
import { PROVIDER_INFO } from "@/lib/ai/providers";
import type { AiProvider } from "@/lib/db/schema";

type SavedKey = {
  id: string;
  provider: AiProvider;
  maskedKey: string;
  updatedAt: Date;
};

const providers: AiProvider[] = ["claude", "openai", "gemini", "mistral"];

export function SettingsClient({ initialKeys }: { initialKeys: SavedKey[] }) {
  const router = useRouter();
  const [keys, setKeys] = useState(initialKeys);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  async function handleSave(provider: AiProvider) {
    const value = inputs[provider];
    if (!value?.trim()) return;

    setSaving(provider);
    const result = await saveApiKey(provider, value);
    setSaving(null);

    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success(`Clé ${PROVIDER_INFO[provider].name} sauvegardée`);
      setInputs((prev) => ({ ...prev, [provider]: "" }));
      router.refresh();
      // Optimistically update the display
      const masked = value.slice(0, 8) + "..." + value.slice(-4);
      setKeys((prev) => {
        const filtered = prev.filter((k) => k.provider !== provider);
        return [...filtered, { id: "", provider, maskedKey: masked, updatedAt: new Date() }];
      });
    }
  }

  async function handleDelete(provider: AiProvider) {
    await deleteApiKey(provider);
    toast.success("Clé supprimée");
    setKeys((prev) => prev.filter((k) => k.provider !== provider));
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Paramètres</h1>
          <p className="text-sm text-muted-foreground">Configurez vos clés API pour la génération IA</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
          ← Retour
        </Button>
      </div>

      <div className="space-y-4">
        {providers.map((provider) => {
          const info = PROVIDER_INFO[provider];
          const existing = keys.find((k) => k.provider === provider);

          return (
            <Card key={provider}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{info.name}</CardTitle>
                <CardDescription className="text-xs">
                  Modèle : {info.model}
                  {existing && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-500">
                      Configuré
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {existing ? (
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded bg-muted px-2 py-1 text-xs">{existing.maskedKey}</code>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(provider)}>
                      Supprimer
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      placeholder={info.placeholder}
                      value={inputs[provider] ?? ""}
                      onChange={(e) => setInputs((prev) => ({ ...prev, [provider]: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && handleSave(provider)}
                      className="font-mono text-sm"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleSave(provider)}
                      disabled={saving === provider || !inputs[provider]?.trim()}
                    >
                      {saving === provider ? "..." : "Sauver"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
