import { NextResponse } from "next/server";

interface VariationsRequest {
  imageBase64: string;
  mimeType: string;
  brandName: string;
  productName: string;
  productDescription: string;
  niche: string;
  toneOfVoice: string;
  primaryColor: string;
}

interface Variation {
  id: string;
  style: "clean" | "tropical" | "premium";
  headline: string;
  body: string;
  cta: string;
  caption: string;
  hashtags: string[];
  metaAdsCopy?: string;
}

const STYLE_PROMPTS = {
  clean: "Clean/minimalista - estilo clean, espaçamento generoso, tipografia elegante, cores neutras, foco no produto",
  tropical: "Colorido/vibrante - cores vivas, layout dinâmico, tipografia moderna, energia, juventude",
  premium: "Premium/sofisticado - estilo luxury, ouro/preto, tipografia serifada, sofisticação máxima",
};

async function generateWithAnthropic(
  req: VariationsRequest,
  style: "clean" | "tropical" | "premium"
): Promise<Variation | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const styleWords = style === "clean" ? "clean, minimal, essencial, moderno" :
                      style === "tropical" ? "color, energia, vibes, trend, tropical" :
                      "luxury, premium, exclusivo, sofisticado, oro";

    const prompt = `Você é um diretor de arte publicitário. Crie copy para estilo: ${STYLE_PROMPTS[style]}

Produto: ${req.productName}
Descrição: ${req.productDescription}
Marca: ${req.brandName}
Nicho: ${req.niche}
Tom: ${req.toneOfVoice}

Retorne JSON com:
- "headline": título poderoso (máx 6 palavras)
- "body": texto persuasivo (160 caracteres)
- "cta": chamada urgente
- "caption": legenda para Instagram (sem hashtags)
- "hashtags": 5-8 hashtags sem #
- "metaAdsCopy": copy curto para Meta Ads (até 125 caracteres)

Use palavras-chave: ${styleWords}`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }],
        system: "Você é um redator publicitário especialista. Responda SEMPRE em JSON válido.",
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const content = data?.content?.[0]?.text;
    if (typeof content !== "string") return null;
    
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return null;
    
    const parsed = JSON.parse(match[0]);
    return {
      id: style,
      style,
      headline: parsed.headline || "Produto Incrível",
      body: parsed.body || "Descrição do produto",
      cta: parsed.cta || "Garanta o seu!",
      caption: parsed.caption || "Produto incrível para você!",
      hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags.map((h: string) => h.replace(/^#/, "")) : [],
      metaAdsCopy: parsed.metaAdsCopy || "Produto incrível. Compre já!",
    };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  let payload: VariationsRequest;
  try {
    payload = (await request.json()) as VariationsRequest;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!payload?.imageBase64 || !payload?.mimeType) {
    return NextResponse.json({ error: "Image required" }, { status: 400 });
  }

  const variations: Variation[] = [];

// Try Anthropic first
   if (process.env.ANTHROPIC_API_KEY) {
     for (const style of ["clean", "tropical", "premium"] as const) {
       const result = await generateWithAnthropic(payload, style);
       if (result) variations.push(result);
     }
   }

   // Fallback stubs
   if (variations.length === 0) {
     const brandName = payload.brandName || "Sua Marca";
     const product = payload.productName || "Produto";

     variations.push({
       id: "clean",
       style: "clean",
       headline: `${product} Clean`,
       body: `${brandName} traz o melhor para você. Escolha quality.`,
       cta: "Compre agora",
       caption: `✨ ${product} da ${brandName}. Simplicidade que transforma. #clean #minimal`,
       hashtags: ["clean", "minimal", "quality", "brand"],
       metaAdsCopy: "Produto premium. Qualidade garantida.",
     });
     variations.push({
       id: "tropical",
       style: "tropical",
       headline: `${product} TROPICAL`,
       body: `🔥 ${brandName} explosão de cores!`,
       cta: "Vem pra festa!",
       caption: `💥 ${product} BOMBA! Só hoje!`,
       hashtags: ["tropical", "vibes", "colorido", "trend"],
       metaAdsCopy: "Energia tropical! Peça já o seu!",
     });
     variations.push({
       id: "premium",
       style: "premium",
       headline: `${product} Luxo`,
       body: `Exclusividade ${brandName}. Para quem merece o melhor.`,
       cta: "Garanta sua edição limitada",
       caption: `👑 ${product} PREMIUM. Luxo que você merece.`,
       hashtags: ["luxo", "premium", "exclusivo", "sofisticado"],
       metaAdsCopy: "Versão premium limitada. Aproveite!",
     });
   }

  return NextResponse.json({ variations });
}