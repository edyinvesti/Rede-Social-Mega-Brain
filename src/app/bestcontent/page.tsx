"use client";

import { useState, useRef } from "react";
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

  const feedRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const storyRefs = useRef<Record<string, HTMLDivElement | null>>({});
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
        setVariations([
          {
            id: "clean",
            style: "clean",
            headline: `${brand.productName || "Produto"} Clean`,
            body: `Clean da ${brand.brandName || "marca"}. Qualidade premium.`,
            cta: "Compre agora",
            caption: `✨ ${brand.productName || "Produto"} clean`,
            hashtags: ["clean", "minimal", "quality", "brand"],
            metaAdsCopy: "Produto premium. Qualidade garantida.",
          },
          {
            id: "tropical",
            style: "tropical",
            headline: `${brand.productName || "PRODUTO"} TROPICAL`,
            body: `🔥 ${brand.brandName || "Marca"} explosão!`,
            cta: "Vem pra festa!",
            caption: `💥 ${brand.productName || "Produto"} BOMBA!`,
            hashtags: ["tropical", "vibes", "colorido", "trend"],
            metaAdsCopy: "Energia tropical!",
          },
          {
            id: "premium",
            style: "premium",
            headline: `${brand.productName || "Produto"} Luxo`,
            body: `Exclusividade ${brand.brandName || "marca"}.`,
            cta: "Garanta limitada",
            caption: `👑 ${brand.productName || "Produto"} PREMIUM.`,
            hashtags: ["luxo", "premium", "exclusivo"],
            metaAdsCopy: "Versão premium limitada.",
          },
        ]);
      }
    } catch (err) {
      console.error(err);
      setError("Erro ao gerar criativos.");
    } finally {
      setLoading(false);
      setStep("result");
    }
  };

  const downloadCanvas = async (key: string, type: "feed" | "story") => {
    const node = type === "feed" ? feedRefs.current[key] : storyRefs.current[key];
    if (!node) return;
    const dataUrl = await toPng(node, { quality: 0.95 });
    const link = document.createElement("a");
    link.download = `bestcontent-${key}-${type}.png`;
    link.href = dataUrl;
    link.click();
  };

  const copyText = async (caption: string, hashtags: string[]) => {
    const fullText = `${caption}\n\n${hashtags.map(h => `#${h}`).join(" ")}`;
    await navigator.clipboard.writeText(fullText);
  };

  return (
    <main className="min-h-screen bg-dark-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
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
              <p className="text-sm text-muted mt-2">A IA transforma sua foto em criativo profissional</p>
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
              <label className="block text-sm font-medium mb-2">Descrição</label>
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
                      brand.toneOfVoice === t.value ? "bg-brand text-white" : "bg-dark-800 border border-dark-700"
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

            <div className="grid md:grid-cols-3 gap-6">
              {variations.map((v) => (
                <div key={v.style} className="space-y-4">
                  <h3 className="text-lg font-semibold capitalize text-center">{v.style}</h3>

                  <div
                    ref={(el) => { feedRefs.current[v.style] = el; }}
                    className="rounded-lg overflow-hidden mx-auto"
                    style={{
                      width: 300,
                      height: 300,
                      background: v.style === "clean" ? "#FFFFFF" :
                        v.style === "tropical" ? "linear-gradient(135deg, #34d399, #22d3ee, #facc15)" :
                        "linear-gradient(135deg, #111827, #000000, #78350f)",
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CreativeContent imageBase64={imageBase64} mimeType={mimeType} variation={v} brand={brand} />
                  </div>

                  <div
                    ref={(el) => { storyRefs.current[v.style] = el; }}
                    className="rounded-lg overflow-hidden mx-auto"
                    style={{
                      width: 169,
                      height: 300,
                      background: v.style === "clean" ? "#FFFFFF" :
                        v.style === "tropical" ? "linear-gradient(135deg, #34d399, #22d3ee, #facc15)" :
                        "linear-gradient(135deg, #111827, #000000, #78350f)",
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CreativeContent imageBase64={imageBase64} mimeType={mimeType} variation={v} brand={brand} story />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => downloadCanvas(v.style, "feed")}
                      className="rounded-lg bg-brand py-2 text-xs font-medium"
                    >
                      Feed
                    </button>
                    <button
                      onClick={() => downloadCanvas(v.style, "story")}
                      className="rounded-lg bg-dark-700 py-2 text-xs font-medium"
                    >
                      Story
                    </button>
                  </div>

                  <button
                    onClick={() => copyText(v.caption, v.hashtags)}
                    className="w-full rounded-lg border border-brand/50 py-2 text-xs font-medium text-brand-2"
                  >
                    Copiar legenda
                  </button>
                </div>
              ))}
            </div>

            <div className="text-center">
              <button onClick={() => setStep("upload")} className="rounded-lg bg-dark-700 px-6 py-2">
                Começar novamente
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function CreativeContent({ imageBase64, mimeType, variation, brand, story }: any) {
  return (
    <>
      {imageBase64 && mimeType && (
        <img
          src={`data:${mimeType};base64,${imageBase64}`}
          alt="Produto"
          style={{
            maxWidth: story ? "60%" : "70%",
            maxHeight: story ? "60%" : "70%",
            objectFit: "contain",
            filter: "drop-shadow(0 20px 30px rgba(0,0,0,0.4))",
          }}
        />
      )}

      <div
        style={{
          position: "absolute",
          bottom: story ? 10 : 16,
          left: story ? 10 : 16,
          right: story ? 10 : 16,
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontWeight: 700,
            fontSize: story ? 16 : 20,
            color: variation.style === "clean" ? "#1a1a1a" : "white",
            marginBottom: 2,
          }}
        >
          {variation.headline}
        </h1>
        <p
          style={{
            fontSize: story ? 11 : 14,
            opacity: 0.9,
            color: variation.style === "clean" ? "#444" : "rgba(255,255,255,0.9)",
          }}
        >
          {variation.body}
        </p>
        <button
          style={{
            marginTop: story ? 2 : 4,
            padding: story ? "2px 8px" : "4px 12px",
            borderRadius: 9999,
            fontSize: story ? 10 : 12,
            fontWeight: 700,
            background: brand.primaryColor,
            color: "white",
          }}
        >
          {variation.cta}
        </button>
      </div>
    </>
  );
}