import type { BrandProfile } from "./types";

export interface CopyRequest {
  topic: string;
  formatName: string;
  brand: Pick<
    BrandProfile,
    | "brandName"
    | "brandDescription"
    | "objective"
    | "audience"
    | "toneOfVoice"
  >;
}

export interface CopyResult {
  headline: string;
  highlight: string;
  body: string;
  cta: string;
  source: "ai" | "stub";
}

export type AiProvider = "gemini" | "openai" | null;

const OBJECTIVE_CTA: Record<string, string> = {
  vendas: "Garanta o seu agora",
  autoridade: "Saiba mais no link da bio",
  engajamento: "Comenta aqui o que achou",
  leads: "Clique no link da bio",
  trafego: "Acesse agora pelo link da bio",
};

const SYSTEM_PROMPT =
  "Você é um redator publicitário especialista em conteúdo para redes sociais no Brasil. " +
  "Escreva textos curtos, persuasivos e com português impecável. " +
  "Responda SEMPRE em JSON válido.";

/** Returns which provider will be used based on configured env vars. */
export function activeProvider(): AiProvider {
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.OPENAI_API_KEY) return "openai";
  return null;
}

function buildPrompt(req: CopyRequest): string {
  return `Crie o texto de um post (${req.formatName}) sobre o tema: "${req.topic}".
Marca: ${req.brand.brandName}
Descrição da marca: ${req.brand.brandDescription}
Objetivo: ${req.brand.objective}
Público-alvo: ${req.brand.audience}
Tom de voz: ${req.brand.toneOfVoice}

Retorne um JSON com as chaves:
- "headline": título principal curto (até 6 palavras)
- "highlight": 1 a 2 palavras do título que devem ser destacadas em cor
- "body": texto de apoio (até 220 caracteres)
- "cta": chamada para ação curta`;
}

function buildStub(req: CopyRequest): CopyResult {
  const brandName = req.brand.brandName || "sua marca";
  const topic = req.topic.trim() || "novidade da semana";
  // Use the first sentence, capped to a short, punchy headline.
  const firstSentence = topic.split(/[.!?\n]/)[0].trim() || topic;
  const words = firstSentence.split(/\s+/);
  const headline = capitalize(words.slice(0, 6).join(" "));
  const headlineWords = headline.split(/\s+/);
  const highlight =
    headlineWords.length >= 2
      ? headlineWords.slice(-2).join(" ")
      : headlineWords[0];
  return {
    headline,
    highlight,
    body: `${
      req.brand.brandDescription ||
      "Soluções pensadas para gerar resultado de verdade."
    } Conteúdo de ${brandName} para ${
      req.brand.audience || "o seu público"
    }.`,
    cta: OBJECTIVE_CTA[req.brand.objective] ?? "Saiba mais",
    source: "stub",
  };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function mergeWithStub(
  parsed: Partial<CopyResult>,
  req: CopyRequest,
): CopyResult {
  const stub = buildStub(req);
  return {
    headline: parsed.headline?.trim() || stub.headline,
    highlight: parsed.highlight?.trim() || stub.highlight,
    body: parsed.body?.trim() || stub.body,
    cta: parsed.cta?.trim() || stub.cta,
    source: "ai",
  };
}

function safeParse(raw: string): Partial<CopyResult> | null {
  try {
    return JSON.parse(raw) as Partial<CopyResult>;
  } catch {
    // Some models wrap JSON in markdown fences; strip and retry.
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]) as Partial<CopyResult>;
      } catch {
        return null;
      }
    }
    return null;
  }
}

async function generateWithOpenAI(
  req: CopyRequest,
): Promise<CopyResult | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildPrompt(req) },
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") return null;
    const parsed = safeParse(content);
    return parsed ? mergeWithStub(parsed, req) : null;
  } catch {
    return null;
  }
}

async function generateWithGemini(
  req: CopyRequest,
): Promise<CopyResult | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: buildPrompt(req) }],
            },
          ],
          generationConfig: {
            temperature: 0.8,
            responseMimeType: "application/json",
          },
        }),
      },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const content =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof content !== "string") return null;
    const parsed = safeParse(content);
    return parsed ? mergeWithStub(parsed, req) : null;
  } catch {
    return null;
  }
}

export async function generateCopy(req: CopyRequest): Promise<CopyResult> {
  // Prefer Gemini, then OpenAI; fall back to the local stub (demo mode).
  if (process.env.GEMINI_API_KEY) {
    const gemini = await generateWithGemini(req);
    if (gemini) return gemini;
  }
  if (process.env.OPENAI_API_KEY) {
    const openai = await generateWithOpenAI(req);
    if (openai) return openai;
  }
  return buildStub(req);
}
