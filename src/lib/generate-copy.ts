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

const OBJECTIVE_CTA: Record<string, string> = {
  vendas: "Garanta o seu agora",
  autoridade: "Saiba mais no link da bio",
  engajamento: "Comenta aqui o que achou",
  leads: "Clique no link da bio",
  trafego: "Acesse agora pelo link da bio",
};

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

export async function generateCopy(req: CopyRequest): Promise<CopyResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return buildStub(req);
  }

  const system =
    "Você é um redator publicitário especialista em conteúdo para redes sociais no Brasil. " +
    "Escreva textos curtos, persuasivos e com português impecável. " +
    "Responda SEMPRE em JSON válido.";

  const user = `Crie o texto de um post (${req.formatName}) sobre o tema: "${req.topic}".
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
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
      }),
    });

    if (!res.ok) {
      return buildStub(req);
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      return buildStub(req);
    }
    const parsed = JSON.parse(content) as Partial<CopyResult>;
    const stub = buildStub(req);
    return {
      headline: parsed.headline?.trim() || stub.headline,
      highlight: parsed.highlight?.trim() || stub.highlight,
      body: parsed.body?.trim() || stub.body,
      cta: parsed.cta?.trim() || stub.cta,
      source: "ai",
    };
  } catch {
    return buildStub(req);
  }
}
