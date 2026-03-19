import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import { Mistral } from "@mistralai/mistralai";
import type { AiProvider } from "@/lib/db/schema";

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

export const PROVIDER_INFO: Record<AiProvider, { name: string; placeholder: string; model: string }> = {
  claude: { name: "Claude (Anthropic)", placeholder: "sk-ant-api03-...", model: "claude-sonnet-4-20250514" },
  openai: { name: "ChatGPT (OpenAI)", placeholder: "sk-...", model: "gpt-4o" },
  gemini: { name: "Gemini (Google)", placeholder: "AIza...", model: "gemini-2.0-flash" },
  mistral: { name: "Mistral", placeholder: "...", model: "mistral-large-latest" },
  github: { name: "GitHub Models", placeholder: "ghp_... ou github_pat_...", model: "openai/gpt-4o" },
};

async function generateWithClaude(apiKey: string, prompt: string): Promise<string> {
  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: PROVIDER_INFO.claude.model,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });
  return message.content[0].type === "text" ? message.content[0].text : "";
}

async function generateWithOpenAI(apiKey: string, prompt: string): Promise<string> {
  const client = new OpenAI({ apiKey });
  const response = await client.responses.create({
    model: PROVIDER_INFO.openai.model,
    instructions: SYSTEM_PROMPT,
    input: prompt,
  });
  return response.output_text;
}

async function generateWithGemini(apiKey: string, prompt: string): Promise<string> {
  const client = new GoogleGenAI({ apiKey });
  const response = await client.models.generateContent({
    model: PROVIDER_INFO.gemini.model,
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      maxOutputTokens: 4096,
    },
  });
  return response.text ?? "";
}

async function generateWithGitHub(token: string, prompt: string): Promise<string> {
  const client = new OpenAI({
    apiKey: token,
    baseURL: "https://models.github.ai/inference",
  });
  const response = await client.chat.completions.create({
    model: PROVIDER_INFO.github.model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    max_tokens: 4096,
  });
  return response.choices[0]?.message?.content ?? "";
}

async function generateWithMistral(apiKey: string, prompt: string): Promise<string> {
  const client = new Mistral({ apiKey });
  const response = await client.chat.complete({
    model: PROVIDER_INFO.mistral.model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    maxTokens: 4096,
  });
  const choice = response.choices?.[0];
  return typeof choice?.message?.content === "string" ? choice.message.content : "";
}

export async function generateSlides(
  provider: AiProvider,
  apiKey: string,
  prompt: string
): Promise<string> {
  switch (provider) {
    case "claude":
      return generateWithClaude(apiKey, prompt);
    case "openai":
      return generateWithOpenAI(apiKey, prompt);
    case "gemini":
      return generateWithGemini(apiKey, prompt);
    case "mistral":
      return generateWithMistral(apiKey, prompt);
    case "github":
      return generateWithGitHub(apiKey, prompt);
    default:
      throw new Error(`Provider inconnu: ${provider}`);
  }
}
