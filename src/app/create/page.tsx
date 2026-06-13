"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toPng } from "html-to-image";
import { AppNav } from "@/components/AppNav";
import { PosterPreview } from "@/components/PosterPreview";
import { useBrand } from "@/lib/brand-context";
import { FORMATS, getFormat } from "@/lib/formats";
import type { CopyResult } from "@/lib/generate-copy";
import type { GeneratedPost } from "@/lib/types";

export default function CreatePage() {
  const router = useRouter();
  const { brand, ready, addPost } = useBrand();
  const posterRef = useRef<HTMLDivElement>(null);

  const [formatId, setFormatId] = useState(FORMATS[0].id);
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [aiEnabled, setAiEnabled] = useState<boolean | null>(null);
  const [post, setPost] = useState<GeneratedPost | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ready && !brand.completed) {
      router.replace("/onboarding");
    }
  }, [ready, brand.completed, router]);

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((d) => setAiEnabled(Boolean(d.aiEnabled)))
      .catch(() => setAiEnabled(false));
  }, []);

  const format = getFormat(formatId) ?? FORMATS[0];

  const generate = async () => {
    if (!topic.trim()) {
      setError("Descreva o tema do post.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          formatName: format.name,
          brand: {
            brandName: brand.brandName,
            brandDescription: brand.brandDescription,
            objective: brand.objective,
            audience: brand.audience,
            toneOfVoice: brand.toneOfVoice,
          },
        }),
      });
      if (!res.ok) throw new Error("Falha ao gerar conteúdo.");
      const copy = (await res.json()) as CopyResult;
      setPost({
        id: crypto.randomUUID(),
        formatId,
        topic,
        headline: copy.headline,
        highlight: copy.highlight,
        body: copy.body,
        cta: copy.cta,
        createdAt: Date.now(),
      });
    } catch {
      setError("Não foi possível gerar o conteúdo. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const download = async () => {
    if (!posterRef.current || !post) return;
    setDownloading(true);
    try {
      const scale = format.width / posterRef.current.offsetWidth;
      const dataUrl = await toPng(posterRef.current, {
        pixelRatio: scale,
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = `${brand.brandName || "post"}-${format.id}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setDownloading(false);
    }
  };

  const save = () => {
    if (!post) return;
    addPost(post);
    router.push("/dashboard");
  };

  if (!ready) return null;

  const previewWidth = format.height > format.width ? 300 : 380;

  return (
    <main className="flex-1">
      <AppNav />
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[1fr_420px]">
        {/* left: controls */}
        <div>
          <h1 className="text-2xl font-bold">Criar conteúdo</h1>
          <p className="mt-1 text-muted">
            Escolha o formato, descreva o tema e a IA cria a arte com a sua
            identidade.
          </p>

          {aiEnabled === false && (
            <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300">
              Modo demo: sem chave de IA configurada, o texto é gerado por
              modelo local de exemplo. Configure <code>OPENAI_API_KEY</code>{" "}
              para textos gerados por IA.
            </div>
          )}

          <div className="mt-6">
            <p className="mb-3 text-sm font-medium">Formato</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {FORMATS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFormatId(f.id)}
                  className={`rounded-xl border p-3 text-left transition ${
                    formatId === f.id
                      ? "border-brand bg-brand/10"
                      : "border-border bg-surface-2 hover:border-brand-2/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{f.name}</span>
                    {f.top && (
                      <span className="rounded bg-brand/20 px-1.5 py-0.5 text-[10px] font-semibold text-brand-2">
                        TOP
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted">{f.sizeLabel}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <label className="block space-y-2">
              <span className="text-sm font-medium">Tema do post</span>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={3}
                placeholder="Ex: Dia Mundial da Saúde Mental — cuidar da mente é investir na longevidade"
                className="input"
              />
            </label>
          </div>

          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

          <button
            type="button"
            onClick={generate}
            disabled={loading}
            className="brand-gradient mt-5 w-full rounded-xl px-6 py-3 text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Gerando..." : "✨ Gerar com IA"}
          </button>
        </div>

        {/* right: preview */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <p className="mb-4 text-sm font-medium text-muted">Pré-visualização</p>
            <div className="flex justify-center">
              {post ? (
                <PosterPreview
                  ref={posterRef}
                  brand={brand}
                  post={post}
                  format={format}
                  width={previewWidth}
                />
              ) : (
                <div
                  className="flex items-center justify-center rounded-lg border border-dashed border-border text-center text-sm text-muted"
                  style={{
                    width: previewWidth,
                    height:
                      (previewWidth * format.height) / format.width,
                  }}
                >
                  A arte aparece aqui após gerar.
                </div>
              )}
            </div>

            {post && (
              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={download}
                  disabled={downloading}
                  className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition hover:border-brand-2/50 disabled:opacity-50"
                >
                  {downloading ? "Baixando..." : "Baixar PNG"}
                </button>
                <button
                  type="button"
                  onClick={save}
                  className="brand-gradient flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:opacity-90"
                >
                  Salvar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
