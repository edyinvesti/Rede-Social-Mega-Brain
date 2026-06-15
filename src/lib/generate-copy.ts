import type { BrandProfile, SocialNetwork } from "./types";
import { NETWORK_LABELS } from "./types";

export interface CopyRequest {
  topic: string;
  formatName: string;
  network: SocialNetwork;
  brand: Pick<
    BrandProfile,
    | "brandName"
    | "brandDescription"
    | "objective"
    | "audience"
    | "toneOfVoice"
  >;
}

/** Request for image-based (vision) content generation */
export interface ImageCopyRequest {
  /** base64-encoded image data (without the data:...;base64, prefix) */
  imageBase64: string;
  /** MIME type of the image, e.g. "image/jpeg" */
  mimeType: string;
  /** Optional topic hint — if omitted the AI infers from the image */
  topic?: string;
  formatName: string;
  network: SocialNetwork;
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
  caption: string;
  hashtags: string[];
  source: "ai" | "stub";
  backgroundPrompt?: string;
}

const OBJECTIVE_CTA: Record<string, string> = {
  vendas: "Garanta o seu agora",
  autoridade: "Saiba mais no link da bio",
  engajamento: "Comenta aqui o que achou",
  leads: "Clique no link da bio",
  trafego: "Acesse agora pelo link da bio",
};

/** Per-network guidance so the caption matches each platform's style. */
const NETWORK_CAPTION_STYLE: Record<SocialNetwork, string> = {
  instagram:
    "Instagram: legenda envolvente com 1 gancho na 1a linha, emojis com moderação e uma chamada para ação.",
  facebook:
    "Facebook: legenda clara e um pouco mais longa, tom conversacional, pode incluir pergunta para gerar comentários.",
  linkedin:
    "LinkedIn: tom profissional e de autoridade, sem gírias, foco em valor e insight; emojis raríssimos.",
  whatsapp:
    "WhatsApp Status: mensagem curta e direta, pessoal, como se falasse com um amigo; pode usar emojis.",
  tiktok:
    "TikTok: tom informal e jovem, ganchos fortes, linguagem de tendência, emojis à vontade.",
  youtube:
    "YouTube Shorts: descrição curta e chamativa que estimula o clique e a inscrição no canal.",
  kwai:
    "Kwai: tom popular e descontraído, direto ao ponto, com apelo emocional e emojis.",
  x:
    "X (Twitter): texto curto e impactante (até ~200 caracteres), tom afiado, pode ter 1 a 2 hashtags no fim.",
  pinterest:
    "Pinterest: descrição inspiradora e descritiva, rica em palavras-chave de busca, foco em ideias e dicas.",
};

export type AiProvider = "gemini" | "openai" | null;

const SYSTEM_PROMPT =
  "Você é um redator publicitário especialista em conteúdo para redes sociais no Brasil. " +
  "Escreva textos ULTRA-PERSUASIVOS, focados em conversão e vendas. " +
  "Use gatilhos mentais (escassez, urgência, prova social). " +
  "Responda SEMPRE em JSON válido.";

/** Returns which provider will be used based on configured env vars. */
export function activeProvider(): AiProvider {
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.OPENAI_API_KEY) return "openai";
  return null;
}

function buildPrompt(req: CopyRequest): string {
  const objectivePush = {
    vendas: "Foco: GATILHO DE VENDA IMEDIATA - mostre benefício + escassez + urgência",
    autoridade: "Foco: GATILHO DE AUTORIDADE - mostre expertise + cases + diferencial",
    engajamento: "Foco: GATILHO DE INTERAÇÃO - pergunta + desafio + convite para comentar",
    leads: "Foco: GATILHO DE CURIOSIDADE + VALOR GRATUITO - ofereça algo de valor",
    trafego: "Foco: GATILHO DE TRÁFEGO - conteúdo viralizável + CTA forte",
  }[req.brand.objective] || "Foco: CONVERSÃO MÁXIMA";

  return `Crie o texto de um post COMERCIAL (${req.formatName}) sobre o tema: "${req.topic}".
Marca: ${req.brand.brandName}
Descrição da marca: ${req.brand.brandDescription}
Objetivo: ${req.brand.objective}
Público-alvo: ${req.brand.audience}
Tom de voz: ${req.brand.toneOfVoice}
${objectivePush}

Rede social de destino: ${NETWORK_LABELS[req.network]}
Estilo da legenda para esta rede: ${NETWORK_CAPTION_STYLE[req.network]}

Retorne um JSON com as chaves:
- "headline": título POWERFUL curto (até 6 palavras) com gatilho mental
- "highlight": 1 a 2 palavras do título que devem ser destacadas (use palavras que EXPLODEM conversão)
- "body": texto de apoio PERSUASIVO (até 220 caracteres) com benefício principal
- "cta": chamada para ação URGENTE e específico
- "caption": legenda pronta para publicar na rede ${NETWORK_LABELS[req.network]}, no estilo descrito acima (não inclua as hashtags dentro da legenda)
- "hashtags": array de 5 a 8 hashtags COMERCIAIS relevantes, sem o caractere "#" e sem espaços`;
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
  const body = `${
    req.brand.brandDescription ||
    "Soluções pensadas para gerar resultado de verdade."
  } Conteúdo de ${brandName} para ${req.brand.audience || "o seu público"}.`;
  const cta = OBJECTIVE_CTA[req.brand.objective] ?? "Saiba mais";
  return {
    headline,
    highlight,
    body,
    cta,
    caption: `${headline} — ${body} ${cta}.`,
    hashtags: buildStubHashtags(req),
    source: "stub",
    backgroundPrompt: "luxury product studio, professional commercial lighting, marble surface, premium branding background, 8k resolution --ar 9:16",
  };
}

function buildStubHashtags(req: CopyRequest): string[] {
  const slug = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  const brandTag = slug(req.brand.brandName);
  const topicTags = req.topic
    .split(/\s+/)
    .map(slug)
    .filter((w) => w.length > 3)
    .slice(0, 3);
  const commercialTags: Record<string, string[]> = {
    vendas: ["promocao", "ofertaespecial", "compreagora", "liquidfy", "desconto"],
    autoridade: ["expert", "dicasprofissionais", "conteudoexclusivo", "conhecimento"],
    engajamento: ["comunidade", "engajamento", "compartilhe", "interaja"],
    leads: ["cadastrese", "newsletter", "conteudogratis", "inscreva"],
    trafego: ["linknaobi", "acesseoartigo", "conteudoexclusivo"],
  };
  const base = commercialTags[req.brand.objective] ?? ["conteudo", "inovacao"];
  return Array.from(
    new Set([...(brandTag ? [brandTag] : []), ...topicTags, ...base]),
  ).slice(0, 8);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function mergeWithStub(
  parsed: Partial<CopyResult>,
  req: CopyRequest,
): CopyResult {
  const stub = buildStub(req);
  const hashtags = Array.isArray(parsed.hashtags)
    ? parsed.hashtags
        .map((h) => String(h).replace(/^#/, "").trim())
        .filter(Boolean)
    : [];
  return {
    headline: parsed.headline?.trim() || stub.headline,
    highlight: parsed.highlight?.trim() || stub.highlight,
    body: parsed.body?.trim() || stub.body,
    cta: parsed.cta?.trim() || stub.cta,
    caption: parsed.caption?.trim() || stub.caption,
    hashtags: hashtags.length > 0 ? hashtags : stub.hashtags,
    source: "ai",
    backgroundPrompt: parsed.backgroundPrompt?.trim() || stub.backgroundPrompt,
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
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
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

// ---------------------------------------------------------------------------
// Carousel (multi-slide) generation
// ---------------------------------------------------------------------------

export interface CarouselSlide {
  title: string;
  text: string;
}

export interface CarouselResult {
  slides: CarouselSlide[];
  caption: string;
  hashtags: string[];
  source: "ai" | "stub";
}

export interface CarouselRequest extends CopyRequest {
  slideCount: number;
}

function buildCarouselPrompt(req: CarouselRequest): string {
  const objectiveGuidance = {
    vendas: "Foco em vendas - destaque benefícios, transformação e escassez",
    autoridade: "Foco em autoridade - mostre expertise, cases de sucesso",
    engajamento: "Foco em engajamento - use perguntas e chamadas para interação",
    leads: "Foco em leads - valor educacional + conversão",
    trafego: "Foco em tráfego - conteúdo viralizável com CTA forte",
  }[req.brand.objective] || "Foco em conversão";

  return `Crie o roteiro de um CARROSSEL VENDÁVEL de ${req.slideCount} slides para ${NETWORK_LABELS[req.network]} sobre o tema: "${req.topic}".
Marca: ${req.brand.brandName}
Descrição da marca: ${req.brand.brandDescription}
Objetivo: ${req.brand.objective}
Público-alvo: ${req.brand.audience}
Tom de voz: ${req.brand.toneOfVoice}
${objectiveGuidance}

Regras do carrossel:
- Slide 1 = capa GIGANTE com gancho que explode o scroll (máximo impacto)
- Slides do meio = valor imediato, benefício claro, linguagem que faz o cliente pensar "quero"
- Último slide = CTA URGENTE e específico (${OBJECTIVE_CTA[req.brand.objective] ?? "Garanta o seu agora"})

Retorne um JSON com as chaves:
- "slides": array com exatamente ${req.slideCount} itens, cada um com "title" (até 6 palavras POWERFUL) e "text" (até 160 caracteres, foco em VENDA)
- "caption": legenda pronta para publicar no estilo de ${NETWORK_LABELS[req.network]} (sem as hashtags)
- "hashtags": array de 5 a 8 hashtags comerciais relevantes, sem o caractere "#" e sem espaços`;
}

function buildCarouselStub(req: CarouselRequest): CarouselResult {
  const base = buildStub(req);
  const slides: CarouselSlide[] = [];
  const urgencyWords = ["IMPACTO", "TRANSFORMAÇÃO", "RESULTADO", "GARANTIA", "OFERTA"];
  for (let i = 0; i < req.slideCount; i++) {
    if (i === 0) {
      slides.push({ title: `${base.headline} - VOCÊ VAI AMAR!`, text: req.topic.trim() || base.body });
    } else if (i === req.slideCount - 1) {
      slides.push({ title: `ÚLTIMA CHANCE!`, text: `Clique agora: ${base.cta} - Estoques limitados!` });
    } else {
      slides.push({
        title: `${urgencyWords[i % urgencyWords.length]} Real`,
        text: `Benefício ${i}: ${base.body}`,
      });
    }
  }
  return {
    slides,
    caption: base.caption,
    hashtags: base.hashtags,
    source: "stub",
  };
}

interface ParsedCarousel {
  slides?: Array<{ title?: unknown; text?: unknown }>;
  caption?: unknown;
  hashtags?: unknown;
}

function mergeCarousel(
  raw: string,
  req: CarouselRequest,
): CarouselResult | null {
  const parsed = safeParse(raw) as ParsedCarousel | null;
  if (!parsed || !Array.isArray(parsed.slides) || parsed.slides.length === 0) {
    return null;
  }
  const stub = buildCarouselStub(req);
  const slides: CarouselSlide[] = parsed.slides
    .map((s) => ({
      title: typeof s.title === "string" ? s.title.trim() : "",
      text: typeof s.text === "string" ? s.text.trim() : "",
    }))
    .filter((s) => s.title || s.text);
  if (slides.length === 0) return null;
  const hashtags = Array.isArray(parsed.hashtags)
    ? parsed.hashtags.map((h) => String(h).replace(/^#/, "").trim()).filter(Boolean)
    : [];
  return {
    slides,
    caption:
      typeof parsed.caption === "string" && parsed.caption.trim()
        ? parsed.caption.trim()
        : stub.caption,
    hashtags: hashtags.length > 0 ? hashtags : stub.hashtags,
    source: "ai",
  };
}

async function carouselWithGemini(
  req: CarouselRequest,
): Promise<CarouselResult | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [
            { role: "user", parts: [{ text: buildCarouselPrompt(req) }] },
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
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof content !== "string") return null;
    return mergeCarousel(content, req);
  } catch {
    return null;
  }
}

async function carouselWithOpenAI(
  req: CarouselRequest,
): Promise<CarouselResult | null> {
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
          { role: "user", content: buildCarouselPrompt(req) },
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") return null;
    return mergeCarousel(content, req);
  } catch {
    return null;
  }
}

export async function generateCarousel(
  req: CarouselRequest,
): Promise<CarouselResult> {
  if (process.env.GEMINI_API_KEY) {
    const gemini = await carouselWithGemini(req);
    if (gemini) return gemini;
  }
  if (process.env.OPENAI_API_KEY) {
    const openai = await carouselWithOpenAI(req);
    if (openai) return openai;
  }
  return buildCarouselStub(req);
}

// ---------------------------------------------------------------------------
// Content calendar (weekly idea suggestions)
// ---------------------------------------------------------------------------

export interface CalendarRequest {
  /** Niche label or free text (e.g. "Saúde & Bem-estar") */
  niche: string;
  /** Number of ideas/days to plan */
  days: number;
  /** Optional notable dates to weave in (commemorative dates near now) */
  occasions?: string[];
  brand: CopyRequest["brand"];
}

export interface CalendarIdea {
  day: string;
  title: string;
  format: string;
  network: SocialNetwork;
}

export interface CalendarResult {
  ideas: CalendarIdea[];
  source: "ai" | "stub";
}

const DAY_LABELS = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
];

const VALID_NETWORKS = new Set<SocialNetwork>([
  "instagram",
  "facebook",
  "linkedin",
  "whatsapp",
  "tiktok",
  "youtube",
  "kwai",
  "x",
  "pinterest",
]);

function buildCalendarPrompt(req: CalendarRequest): string {
  const occasions =
    req.occasions && req.occasions.length > 0
      ? `\nDatas comemorativas próximas para considerar quando fizer sentido: ${req.occasions.join(", ")}.`
      : "";
  return `Monte uma pauta de conteúdo com ${req.days} ideias de publicação para o nicho "${req.niche}".
Marca: ${req.brand.brandName}
Descrição da marca: ${req.brand.brandDescription}
Objetivo: ${req.brand.objective}
Público-alvo: ${req.brand.audience}
Tom de voz: ${req.brand.toneOfVoice}${occasions}

Regras:
- Varie os ângulos (dica, bastidores, prova social, oferta, educativo, tendência).
- Distribua entre formatos e redes diferentes para alcançar mais pessoas.
- Cada ideia deve ser um tema específico e pronto para virar um post.

Retorne um JSON com a chave "ideas": um array com exatamente ${req.days} itens, cada um com:
- "day": dia da semana (ex: "Segunda")
- "title": o tema/ideia do post (frase curta e específica)
- "format": formato sugerido (ex: "Reels", "Carrossel", "Post único", "Stories")
- "network": uma rede entre instagram, facebook, linkedin, whatsapp, tiktok, youtube, kwai, x, pinterest`;
}

function buildCalendarStub(req: CalendarRequest): CalendarResult {
  const networks: SocialNetwork[] = [
    "instagram",
    "tiktok",
    "instagram",
    "linkedin",
    "instagram",
    "youtube",
    "instagram",
  ];
  const formats = [
    "Reels",
    "Carrossel",
    "Post único",
    "Stories",
    "Carrossel",
    "Reels",
    "Post único",
  ];
  const angles = [
    "3 dicas rápidas sobre",
    "Mito x verdade:",
    "Bastidores do nosso trabalho com",
    "O erro mais comum em",
    "Passo a passo de",
    "Antes e depois:",
    "Pergunta para a audiência sobre",
  ];
  const ideas: CalendarIdea[] = [];
  for (let i = 0; i < req.days; i++) {
    ideas.push({
      day: DAY_LABELS[i % DAY_LABELS.length],
      title: `${angles[i % angles.length]} ${req.niche.toLowerCase()}`,
      format: formats[i % formats.length],
      network: networks[i % networks.length],
    });
  }
  return { ideas, source: "stub" };
}

interface ParsedCalendar {
  ideas?: Array<{
    day?: unknown;
    title?: unknown;
    format?: unknown;
    network?: unknown;
  }>;
}

function mergeCalendar(raw: string): CalendarResult | null {
  const parsed = safeParse(raw) as ParsedCalendar | null;
  if (!parsed || !Array.isArray(parsed.ideas) || parsed.ideas.length === 0) {
    return null;
  }
  const ideas: CalendarIdea[] = parsed.ideas
    .map((it, i) => {
      const net = String(it.network ?? "").toLowerCase() as SocialNetwork;
      return {
        day:
          typeof it.day === "string" && it.day.trim()
            ? it.day.trim()
            : DAY_LABELS[i % DAY_LABELS.length],
        title: typeof it.title === "string" ? it.title.trim() : "",
        format:
          typeof it.format === "string" && it.format.trim()
            ? it.format.trim()
            : "Post único",
        network: VALID_NETWORKS.has(net) ? net : "instagram",
      };
    })
    .filter((it) => it.title);
  if (ideas.length === 0) return null;
  return { ideas, source: "ai" };
}

async function calendarWithGemini(
  req: CalendarRequest,
): Promise<CalendarResult | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [
            { role: "user", parts: [{ text: buildCalendarPrompt(req) }] },
          ],
          generationConfig: {
            temperature: 0.9,
            responseMimeType: "application/json",
          },
        }),
      },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof content !== "string") return null;
    return mergeCalendar(content);
  } catch {
    return null;
  }
}

async function calendarWithOpenAI(
  req: CalendarRequest,
): Promise<CalendarResult | null> {
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
          { role: "user", content: buildCalendarPrompt(req) },
        ],
        response_format: { type: "json_object" },
        temperature: 0.9,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") return null;
    return mergeCalendar(content);
  } catch {
    return null;
  }
}

export async function generateCalendar(
  req: CalendarRequest,
): Promise<CalendarResult> {
  if (process.env.GEMINI_API_KEY) {
    const gemini = await calendarWithGemini(req);
    if (gemini) return gemini;
  }
  if (process.env.OPENAI_API_KEY) {
    const openai = await calendarWithOpenAI(req);
    if (openai) return openai;
  }
  return buildCalendarStub(req);
}

// ---------------------------------------------------------------------------
// Image-based generation (vision / multimodal)
// ---------------------------------------------------------------------------

function buildImagePrompt(req: ImageCopyRequest): string {
  const topicHint = req.topic?.trim()
    ? `O usuário indica que o tema é: "${req.topic}". `
    : "";
  const objectivePush = {
    vendas: "Foco: GATILHO DE VENDA - destaque o BENEFÍCIO principal do produto",
    autoridade: "Foco: GATILHO DE QUALIDADE - mostre o diferencial técnico",
    engajamento: "Foco: GATILHO DE DESEJO - crie apelo emocional forte",
    leads: "Foco: GATILHO DE INTERESSE - destaque o valor agregado",
    trafego: "Foco: GATILHO DE VIRALIZAÇÃO - destaque o que explode o scroll",
  }[req.brand.objective] || "Foco: CONVERSÃO";

  return `${topicHint}Analise a imagem enviada e crie o texto de marketing ULTRA-PERSUASIVO de um post (${req.formatName}) para ${NETWORK_LABELS[req.network]}.
Marca: ${req.brand.brandName}
Descrição da marca: ${req.brand.brandDescription}
Objetivo: ${req.brand.objective}
Público-alvo: ${req.brand.audience}
Tom de voz: ${req.brand.toneOfVoice}
${objectivePush}

Com base no que você vê na imagem, retorne um JSON com as chaves:
- "headline": título POWERFUL curto (até 6 palavras) que EXPLODA o scroll
- "highlight": 1 a 2 palavras do título que devem ser destacadas (palavras-chave de conversão)
- "body": texto PERSUASIVO (até 220 caracteres) com benefício + gatilho mental
- "cta": chamada para ação URGENTE
- "caption": legenda pronta para publicar em ${NETWORK_LABELS[req.network]} (sem hashtags)
- "hashtags": array de 5 a 8 hashtags COMERCIAIS, sem "#" e sem espaços
- "backgroundPrompt": um prompt SUPER detalhado em INGLÊS para uma imagem de fundo ULTRA-VENDÁVEL (estilo comercial profissional, estilo publicitário premium). O prompt deve descrever: 1) Cenário minimalista ou luxuoso que destaque o produto, 2) Iluminação profissional dramatic, 3) Textura em alta resolução (marble, metal, madeira, concreto, ou superfície premium), 4) Paleta de cores harmoniosa (brand colors), 5) Estilo fotográfico comercial --ar 9:16 para stories/post. Ex: "a luxury cosmetic studio with soft pastel lighting, glossy marble surface, golden reflections, professional product photography, ultra sharp focus, 8k resolution, commercial advertising style" ou "premium tech gadget on dark concrete with blue neon glow, dramatic studio lighting, professional commercial photography, cinematic, ultra detailed". NÃO inclua o produto - apenas o cenário de fundo.`;
}

async function imageWithGemini(
  req: ImageCopyRequest,
): Promise<CopyResult | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [
            {
              role: "user",
              parts: [
                {
                  inlineData: {
                    mimeType: req.mimeType,
                    data: req.imageBase64,
                  },
                },
                { text: buildImagePrompt(req) },
              ],
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
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof content !== "string") return null;
    const parsed = safeParse(content);
    if (!parsed) return null;
    // Build a minimal CopyRequest for mergeWithStub
    const copyReq: CopyRequest = {
      topic: req.topic ?? "",
      formatName: req.formatName,
      network: req.network,
      brand: req.brand,
    };
    return mergeWithStub(parsed, copyReq);
  } catch {
    return null;
  }
}

async function imageWithOpenAI(
  req: ImageCopyRequest,
): Promise<CopyResult | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  // gpt-4o supports vision; gpt-4o-mini does not — override to gpt-4o
  const model =
    process.env.OPENAI_MODEL === "gpt-4o-mini" ||
    !process.env.OPENAI_MODEL
      ? "gpt-4o"
      : process.env.OPENAI_MODEL;
  try {
    const dataUrl = `data:${req.mimeType};base64,${req.imageBase64}`;
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: dataUrl } },
              { type: "text", text: buildImagePrompt(req) },
            ],
          },
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
    if (!parsed) return null;
    const copyReq: CopyRequest = {
      topic: req.topic ?? "",
      formatName: req.formatName,
      network: req.network,
      brand: req.brand,
    };
    return mergeWithStub(parsed, copyReq);
  } catch {
    return null;
  }
}

/** Generate marketing copy from an image using vision AI (Gemini → GPT-4o → stub). */
export async function generateCopyFromImage(
  req: ImageCopyRequest,
): Promise<CopyResult> {
  if (process.env.GEMINI_API_KEY) {
    const gemini = await imageWithGemini(req);
    if (gemini) return gemini;
  }
  if (process.env.OPENAI_API_KEY) {
    const openai = await imageWithOpenAI(req);
    if (openai) return openai;
  }
  // Fallback: stub without vision
  const copyReq: CopyRequest = {
    topic: req.topic ?? "imagem enviada",
    formatName: req.formatName,
    network: req.network,
    brand: req.brand,
  };
  return buildStub(copyReq);
}
