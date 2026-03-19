import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const SYSTEM_PROMPT = `Tu es un expert en création de présentations. L'utilisateur te donne un sujet et tu génères le contenu en markdown structuré pour des slides.

Format obligatoire :
- Chaque slide est séparé par une ligne contenant uniquement ---
- Le premier slide est un titre : # Titre de la présentation suivi d'un sous-titre
- Les slides suivants utilisent ## pour le titre du slide
- Utilise des listes avec - pour les points clés
- Utilise des blocs de code avec \`\`\`lang pour les exemples de code
- Maximum 5-6 bullets par slide
- Maximum 10-15 slides au total
- Sois concis et percutant

Exemple de sortie :
# Les Bases de Docker
Conteneurisation pour les développeurs
---
## Qu'est-ce que Docker ?
- Plateforme de conteneurisation open source
- Isole les applications dans des conteneurs légers
- Garantit la portabilité entre environnements
---
## Commande essentielle
\`\`\`bash
docker run -d -p 8080:80 nginx
\`\`\`
- -d : mode détaché
- -p : mapping de ports

Réponds UNIQUEMENT avec le markdown, sans explication ni commentaire avant ou après. La présentation doit être en français.`;

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Clé API Anthropic non configurée. Ajoutez ANTHROPIC_API_KEY dans .env.local" },
      { status: 500 }
    );
  }

  const { prompt } = await request.json();
  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json({ error: "Prompt requis" }, { status: 400 });
  }

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Extract title from the first line
    const firstLine = text.split("\n")[0];
    const title = firstLine.startsWith("# ") ? firstLine.slice(2).trim() : prompt.slice(0, 50);

    return NextResponse.json({ markdown: text, title });
  } catch {
    return NextResponse.json({ error: "Erreur lors de la génération" }, { status: 500 });
  }
}
