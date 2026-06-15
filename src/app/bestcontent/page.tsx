"use client";

import { useState, useRef, forwardRef } from "react";
import { toPng } from "html-to-image";

interface BrandIdentity {
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

const TONE_OPTIONS = [
  { value: "feminino", label: "Feminino" },
  { value: "natural", label: "Natural" },
  { value: "premium", label: "Premium" },
  { value: "jovem", label: "Jovem" },
  { value: "profissional", label: "Profissional" },
];

const NICHES = [
  { value: "cosmetico", label: "Cosmético" },
  { value: "suplemento", label: "Suplemento" },
  { value: "alimento", label: "Alimento" },
  { value: "moda", label: "Moda" },
  { value: "eletronico", label: "Eletrônico" },
];

export default function BestContentPage() {
  const [step, setStep] = useState<"upload" | "form" | "generate" | "result">("upload");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [brand, setBrand] = useState<BrandIdentity>({
    brandName: "",
    productName: "",
    productDescription: "",
    niche: "cosmetico",
    toneOfVoice: "premium",
    primaryColor: "#FF6B6B",
  });
  const [variations, setVariations] = useState<Variation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canvasRefs = useRef<Record<string, HTMLDivElement | null>>({
    clean: null,
    tropical: null,
    premium: null,
    cleanStory: null,
    tropicalStory: null,
    premiumStory: null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const result = reader.result as string;
      const match = result.match(/^data:(image\/[a-z]+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        const base64 = match[2];

        // Remove background with AI
        try {
          const { removeBackground } = await import("@imgly/background-removal");
          const objectUrl = URL.createObjectURL(file);
          const transparentBlob = await removeBackground(objectUrl);

          const reader2 = new FileReader();
          reader2.onload = () => {
            const result2 = reader2.result as string;
            const match2 = result2.match(/^data:(image\/[a-z]+);base64,(.+)$/);
            if (match2) {
              setMimeType(match2[1]);
              setImageBase64(match2[2]);
              setStep("form");
            }
          };
          reader2.readAsDataURL(transparentBlob);
        } catch (err) {
          console.error("Background removal failed", err);
          setMimeType(mimeType);
          setImageBase64(base64);
          setStep("form");
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const generate = async () => {
    if (!imageBase64) return;
    setLoading(true);
    setError(null);

    try {
      // Try Anthropic API
      const res = await fetch("/api/bestcontent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64,
          mimeType,
          brandName: brand.brandName,
          productName: brand.productName,
          productDescription: brand.productDescription,
          niche: brand.niche,
          toneOfVoice: brand.toneOfVoice,
          primaryColor: brand.primaryColor,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setVariations(data.variations);
      } else {
        // Fallback to stubs
        setVariations([
          {
            id: "clean",
            style: "clean",
            headline: `${brand.productName || "Produto"} Clean`,
            body: `Clean e minimal da ${brand.brandName || "marca"}. Qualidade em cada detalhe.`,
            cta: "Compre agora",
            caption: `✨ ${brand.productName || "Produto"} clean da ${brand.brandName || "marca"}. #clean #minimal`,
            hashtags: ["clean", "minimal", "quality", "brand"],
            metaAdsCopy: "Produto premium. Qualidade garantida.",
          },
          {
            id: "tropical",
            style: "tropical",
            headline: `${brand.productName || "PRODUTO"} TROPICAL`,
            body: `🔥 ${brand.brandName || "Marca"} explosão de cores!`,
            cta: "Vem pra festa!",
            caption: `💥 ${brand.productName || "Produto"} BOMBA! Só hoje! #tropical #vibes`,
            hashtags: ["tropical", "vibes", "colorido", "trend"],
            metaAdsCopy: "Energia tropical! Peça já o seu!",
          },
          {
            id: "premium",
            style: "premium",
            headline: `${brand.productName || "Produto"} Luxo`,
            body: `Exclusividade ${brand.brandName || "marca"}. Para quem merece o melhor.`,
            cta: "Garanta sua edição limitada",
            caption: `👑 ${brand.productName || "Produto"} PREMIUM. Luxo que você merece.`,
            hashtags: ["luxo", "premium", "exclusivo", "sofisticado"],
            metaAdsCopy: "Versão premium limitada. Aproveite!",
          },
        ]);
      }
    } catch (err) {
      console.error(err);
      setError("Erro ao gerar criativos. Tente novamente.");
    } finally {
      setLoading(false);
      setStep("result");
    }
  };

  const downloadCanvas = async (key: string) => {
    const node = canvasRefs.current[key];
    if (!node) return;
    const dataUrl = await toPng(node, { quality: 0.95 });
    const link = document.createElement("a");
    link.download = `bestcontent-${key}.png`;
    link.href = dataUrl;
    link.click();
  };

  const copyText = async (caption: string, hashtags: string[]) => {
    const fullText = `${caption}\n\n${hashtags.map(h => `#${h}`).join(" ")}`;
    await navigator.clipboard.writeText(fullText);
  };

  return (
    <main className="min-h-screen bg-dark-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">BestContent AI</h1>

        {step === "upload" && (
          <div className="flex flex-col items-center">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rounded-xl border-2 border-dashed border-brand/50 bg-brand/5 p-12 text-center hover:bg-brand/10 transition"
            >
              <div className="text-6xl mb-4">📷</div>
              <p className="text-lg font-bold text-brand-2">Toque para tirar foto ou escolher da galeria</p>
              <p className="text-sm text-muted mt-2">A IA vai transformar sua foto em criativo profissional</p>
            </button>
          </div>
        )}

        {step === "form" && (
          <div className="grid gap-6 max-w-xl mx-auto">
            {imageBase64 && mimeType && (
              <div className="flex justify-center mb-4">
                <img
                  src={`data:${mimeType};base64,${imageBase64}`}
                  alt="Preview"
                  className="h-32 w-32 object-contain rounded-lg border-2 border-brand/30"
                />
              </div>
            )}

        {step === "form" && (
          <div className="grid gap-6 max-w-xl mx-auto">
            <div>
              <label className="block text-sm font-medium mb-2">Nome da Marca</label>
              <input
                value={brand.brandName}
                onChange={(e) => setBrand({ ...brand, brandName: e.target.value })}
                className="w-full rounded-lg bg-dark-800 border border-dark-700 px-4 py-2"
                placeholder="Ex: Minha Marca"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Nome do Produto</label>
              <input
                value={brand.productName}
                onChange={(e) => setBrand({ ...brand, productName: e.target.value })}
                className="w-full rounded-lg bg-dark-800 border border-dark-700 px-4 py-2"
                placeholder="Ex: Perfume VIP"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Descrição do Produto</label>
              <textarea
                value={brand.productDescription}
                onChange={(e) => setBrand({ ...brand, productDescription: e.target.value })}
                className="w-full rounded-lg bg-dark-800 border border-dark-700 px-4 py-2"
                rows={3}
                placeholder="Descreva seu produto..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Nicho</label>
              <select
                value={brand.niche}
                onChange={(e) => setBrand({ ...brand, niche: e.target.value })}
                className="w-full rounded-lg bg-dark-800 border border-dark-700 px-4 py-2"
              >
                {NICHES.map((n) => (
                  <option key={n.value} value={n.value}>{n.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tom de Voz</label>
              <div className="grid grid-cols-2 gap-2">
                {TONE_OPTIONS.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setBrand({ ...brand, toneOfVoice: t.value })}
                    className={`rounded-lg px-3 py-2 text-sm ${
                      brand.toneOfVoice === t.value
                        ? "bg-brand text-white"
                        : "bg-dark-800 border border-dark-700"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Cor Principal</label>
              <input
                type="color"
                value={brand.primaryColor}
                onChange={(e) => setBrand({ ...brand, primaryColor: e.target.value })}
                className="w-full h-12 rounded-lg bg-dark-800 border border-dark-700"
              />
            </div>

            <button
              onClick={generate}
              disabled={loading}
              className="rounded-xl bg-brand py-3 font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Gerando criativos..." : "Gerar 3 estilos de criativo"}
            </button>
          </div>
        )}

        {step === "result" && variations.length > 0 && (
          <div className="grid gap-8">
            <h2 className="text-2xl font-bold text-center">Seus criativos estão prontos!</h2>

            <div className="grid md:grid-cols-3 gap-4">
              {variations.map((v) => (
                <div key={v.style} className="space-y-4">
                  <h3 className="text-lg font-semibold capitalize text-center">{v.style}</h3>
                  
                  <CreativeCanvas
                    ref={(el) => { canvasRefs.current[v.style] = el; }}
                    imageBase64={imageBase64}
                    mimeType={mimeType}
                    variation={v}
                    brand={brand}
                    width={1080}
                    height={1080}
                  />
                  
                  <CreativeCanvas
                    ref={(el) => { canvasRefs.current[v.style + "Story"] = el; }}
                    imageBase64={imageBase64}
                    mimeType={mimeType}
                    variation={v}
                    brand={brand}
                    width={1080}
                    height={1920}
                  />

                  <button
                    onClick={() => downloadCanvas(v.style)}
                    className="w-full rounded-lg bg-brand py-2 text-sm font-medium"
                  >
                    Baixar Feed {v.style}
                  </button>
                  <button
                    onClick={() => downloadCanvas(v.style + "Story")}
                    className="w-full rounded-lg bg-dark-700 py-2 text-sm font-medium"
                  >
                    Baixar Story {v.style}
                  </button>

                  <button
                    onClick={() => copyText(v.caption, v.hashtags)}
                    className="w-full rounded-lg border border-brand/50 py-2 text-sm font-medium text-brand-2"
                  >
                    Copiar legenda + hashtags
                  </button>
                </div>
              ))}
            </div>

            <div className="text-center">
              <button
                onClick={() => setStep("upload")}
                className="rounded-lg bg-dark-700 px-6 py-2"
              >
                Começar novamente
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

interface CreativeCanvasProps {
  imageBase64: string | null;
  mimeType: string | null;
  variation: Variation;
  brand: BrandIdentity;
  width: number;
  height: number;
}

const CreativeCanvas = forwardRef<HTMLDivElement, CreativeCanvasProps>(
  ({ imageBase64, mimeType, variation, brand, width, height }, ref) => {
    const ratio = width / height;
    const scale = 300 * ratio;

    const getBackgroundStyle = () => {
      switch (variation.style) {
        case "clean":
          return { background: "#FFFFFF" };
        case "tropical":
          return { background: "linear-gradient(135deg, #34d399, #22d3ee, #facc15)" };
        case "premium":
          return { background: "linear-gradient(135deg, #111827, #000000, #78350f)" };
        default:
          return { background: "#1f2937" };
      }
    };

    return (
      <div
        ref={ref}
        className="rounded-lg overflow-hidden"
        style={{ width: scale, height: 300, ...getBackgroundStyle() }}
      >
        <div
          style={{
            width,
            height,
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {imageBase64 && mimeType && (
            <img
              src={`data:${mimeType};base64,${imageBase64}`}
              alt="Produto"
              style={{
                maxWidth: "70%",
                maxHeight: "70%",
                objectFit: "contain",
                filter:
                  variation.style === "premium"
                    ? "drop-shadow(0 0 30px rgba(255,215,0,0.5))"
                    : variation.style === "tropical"
                    ? "drop-shadow(0 10px 20px rgba(0,0,0,0.3))"
                    : "drop-shadow(0 20px 30px rgba(0,0,0,0.4))",
              }}
            />
          )}

          {variation.style === "tropical" && (
            <svg
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
            >
              <circle cx="20%" cy="30%" r="50" fill="rgba(255,255,255,0.2)" />
              <circle cx="80%" cy="70%" r="80" fill="rgba(255,255,255,0.15)" />
              <ellipse cx="50%" cy="50%" rx="100" ry="60" fill={brand.primaryColor} opacity="0.3" />
            </svg>
          )}

          {variation.style === "premium" && (
            <>
              <div
                style={{
                  position: "absolute",
                  top: "10px",
                  right: "10px",
                  width: "40px",
                  height: "40px",
                  border: "2px solid rgba(255,215,0,0.3)",
                  borderRadius: "50%",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: "40px",
                  left: "20px",
                  width: "32px",
                  height: "32px",
                  border: "1px solid rgba(255,215,0,0.2)",
                }}
              />
            </>
          )}

          <div
            style={{
              position: "absolute",
              bottom: "16px",
              left: "16px",
              right: "16px",
              textAlign: "center",
            }}
          >
            <h1
              style={{
                fontWeight: 700,
                marginBottom: "2px",
                color: variation.style === "clean" ? "#1a1a1a" : "white",
                fontSize: "24px",
                fontFamily: variation.style === "premium" ? "serif" : "sans-serif",
              }}
            >
              {variation.headline}
            </h1>
            <p
              style={{
                fontSize: "14px",
                opacity: 0.9,
                color:
                  variation.style === "clean"
                    ? "#444"
                    : "rgba(255,255,255,0.9)",
              }}
            >
              {variation.body}
            </p>
            <button
              style={{
                marginTop: "8px",
                padding: "4px 16px",
                borderRadius: "9999px",
                fontSize: "12px",
                fontWeight: 700,
                background: brand.primaryColor,
                color: "white",
              }}
            >
              {variation.cta}
            </button>
          </div>
        </div>
      </div>
    );
  }
);