"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toPng } from "html-to-image";
import JSZip from "jszip";
import { AppNav } from "@/components/AppNav";
import {
  PosterPreview,
  EMPTY_OFFSETS,
  type PosterOffsets,
} from "@/components/PosterPreview";
import { useBrand } from "@/lib/brand-context";
import { FORMATS, getFormat } from "@/lib/formats";
import { TEMPLATE_NICHES } from "@/lib/templates";
import type {
  CopyResult,
  CarouselResult,
  CarouselSlide,
} from "@/lib/generate-copy";
import type { GeneratedPost } from "@/lib/types";
import { NETWORK_LABELS } from "@/lib/types";

function CreatePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { brand, ready, addPost } = useBrand();
  const posterRef = useRef<HTMLDivElement>(null);
  const exportRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [formatId, setFormatId] = useState(FORMATS[0].id);
  const [topic, setTopic] = useState(() => searchParams.get("topic") ?? "");
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [aiEnabled, setAiEnabled] = useState<boolean | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [post, setPost] = useState<GeneratedPost | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"caption" | "hashtags" | null>(null);
  const [nicheId, setNicheId] = useState<string | null>(null);
  const [carousel, setCarousel] = useState<CarouselResult | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [slideCount, setSlideCount] = useState(5);
  const slideRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [offsets, setOffsets] = useState<PosterOffsets>(EMPTY_OFFSETS);
  const [editMode, setEditMode] = useState(false);

  const copyText = async (text: string, which: "caption" | "hashtags") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setError("Não foi possível copiar. Copie manualmente.");
    }
  };

  useEffect(() => {
    if (ready && !brand.completed) {
      router.replace("/onboarding");
    }
  }, [ready, brand.completed, router]);

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((d) => {
        setAiEnabled(Boolean(d.aiEnabled));
        setProvider(d.provider ?? null);
      })
      .catch(() => setAiEnabled(false));
  }, []);

  const format = getFormat(formatId) ?? FORMATS[0];
  const isCarousel =
    formatId === "carrossel-portrait" || formatId === "stories-carrossel";

  const slidePost = (slide: CarouselSlide, idx: number): GeneratedPost => ({
    id: `slide-${idx}`,
    formatId,
    topic,
    headline: slide.title,
    highlight: "",
    body: slide.text,
    cta: "",
    createdAt: 0,
  });

  const generateCarouselPost = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/carousel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          slideCount,
          formatName: format.name,
          network: format.network,
          brand: {
            brandName: brand.brandName,
            brandDescription: brand.brandDescription,
            objective: brand.objective,
            audience: brand.audience,
            toneOfVoice: brand.toneOfVoice,
          },
        }),
      });
      if (!res.ok) throw new Error("Falha ao gerar carrossel.");
      const data = (await res.json()) as CarouselResult;
      setCarousel(data);
      setSlideIndex(0);
    } catch {
      setError("Não foi possível gerar o carrossel. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const generate = async () => {
    if (!topic.trim()) {
      setError("Descreva o tema do post.");
      return;
    }
    if (isCarousel) {
      await generateCarouselPost();
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
          network: format.network,
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
      setOffsets(EMPTY_OFFSETS);
      setEditMode(false);
      setPost({
        id: crypto.randomUUID(),
        formatId,
        topic,
        headline: copy.headline,
        highlight: copy.highlight,
        body: copy.body,
        cta: copy.cta,
        caption: copy.caption,
        hashtags: copy.hashtags,
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

  const sharePost = async () => {
    if (!posterRef.current || !post) return;
    setDownloading(true); // Using downloading state to show progress
    try {
      const scale = format.width / posterRef.current.offsetWidth;
      const dataUrl = await toPng(posterRef.current, {
        pixelRatio: scale,
        cacheBust: true,
      });
      
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `${brand.brandName || "post"}.png`, { type: 'image/png' });
      
      const shareData = {
        title: post.headline,
        text: `${post.caption ?? ''}\n\n${(post.hashtags ?? []).map((h) => `#${h}`).join(' ')}`,
        files: [file]
      };
      
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share(shareData);
      } else if (navigator.share) {
        // Fallback without file if file sharing is not supported
        await navigator.share({
          title: shareData.title,
          text: shareData.text,
        });
      } else {
        setError("O compartilhamento não é suportado neste navegador.");
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError("Erro ao compartilhar a imagem.");
      }
    } finally {
      setDownloading(false);
    }
  };

  const downloadAll = async () => {
    if (!post) return;
    setDownloadingAll(true);
    try {
      const zip = new JSZip();
      for (const f of FORMATS) {
        const node = exportRefs.current[f.id];
        if (!node) continue;
        const scale = f.width / node.offsetWidth;
        const dataUrl = await toPng(node, { pixelRatio: scale, cacheBust: true });
        const base64 = dataUrl.split(",")[1];
        zip.file(
          `${NETWORK_LABELS[f.network]}/${brand.brandName || "post"}-${f.id}.png`,
          base64,
          { base64: true },
        );
      }
      if (post.caption) {
        const hashtags = (post.hashtags ?? []).map((h) => `#${h}`).join(" ");
        zip.file(
          "legenda.txt",
          `Legenda (${NETWORK_LABELS[format.network]}):\n${post.caption}\n\nHashtags:\n${hashtags}\n`,
        );
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `${brand.brandName || "post"}-todas-as-redes.zip`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloadingAll(false);
    }
  };

  const downloadSlide = async () => {
    const node = slideRefs.current[slideIndex];
    if (!node) return;
    setDownloading(true);
    try {
      const scale = format.width / node.offsetWidth;
      const dataUrl = await toPng(node, { pixelRatio: scale, cacheBust: true });
      const link = document.createElement("a");
      link.download = `${brand.brandName || "carrossel"}-slide-${slideIndex + 1}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setDownloading(false);
    }
  };

  const downloadCarousel = async () => {
    if (!carousel) return;
    setDownloadingAll(true);
    try {
      const zip = new JSZip();
      for (let i = 0; i < carousel.slides.length; i++) {
        const node = slideRefs.current[i];
        if (!node) continue;
        const scale = format.width / node.offsetWidth;
        const dataUrl = await toPng(node, { pixelRatio: scale, cacheBust: true });
        zip.file(
          `${brand.brandName || "carrossel"}-slide-${String(i + 1).padStart(2, "0")}.png`,
          dataUrl.split(",")[1],
          { base64: true },
        );
      }
      const hashtags = (carousel.hashtags ?? []).map((h) => `#${h}`).join(" ");
      zip.file(
        "legenda.txt",
        `Legenda (${NETWORK_LABELS[format.network]}):\n${carousel.caption}\n\nHashtags:\n${hashtags}\n`,
      );
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `${brand.brandName || "carrossel"}-carrossel.zip`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloadingAll(false);
    }
  };

  const save = () => {
    if (!post) return;
    addPost({ ...post, offsets });
    router.push("/dashboard");
  };

  const updatePost = (patch: Partial<GeneratedPost>) => {
    setPost((p) => (p ? { ...p, ...patch } : p));
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
              modelo local de exemplo. Configure <code>GEMINI_API_KEY</code> ou{" "}
              <code>OPENAI_API_KEY</code> para textos gerados por IA.
            </div>
          )}
          {aiEnabled === true && provider && (
            <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
              IA ativa via{" "}
              <span className="font-semibold capitalize">{provider}</span>.
            </div>
          )}

          <div className="mt-6">
            <p className="mb-3 text-sm font-medium">Formato</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {FORMATS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setFormatId(f.id);
                    // Avoid preview/download diverging from the post's format.
                    setPost(null);
                    setCarousel(null);
                    setSlideIndex(0);
                    setOffsets(EMPTY_OFFSETS);
                    setEditMode(false);
                  }}
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
                  <span className="mt-0.5 block text-xs font-medium text-brand-2">
                    {NETWORK_LABELS[f.network]}
                  </span>
                  <span className="text-xs text-muted">{f.sizeLabel}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <p className="mb-3 text-sm font-medium">
              Modelos de pauta <span className="text-muted">(opcional)</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {TEMPLATE_NICHES.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => setNicheId(nicheId === n.id ? null : n.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    nicheId === n.id
                      ? "border-brand bg-brand/10 text-brand-2"
                      : "border-border bg-surface-2 hover:border-brand-2/50"
                  }`}
                >
                  {n.emoji} {n.label}
                </button>
              ))}
            </div>
            {nicheId && (
              <div className="mt-3 grid gap-2">
                {TEMPLATE_NICHES.find((n) => n.id === nicheId)?.ideas.map(
                  (idea) => (
                    <button
                      key={idea}
                      type="button"
                      onClick={() => {
                        setTopic(idea);
                        setPost(null);
                      }}
                      className="rounded-xl border border-border bg-surface-2 p-3 text-left text-sm text-muted transition hover:border-brand-2/50 hover:text-foreground"
                    >
                      {idea}
                    </button>
                  ),
                )}
              </div>
            )}
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

          {isCarousel && (
            <div className="mt-6">
              <p className="mb-3 text-sm font-medium">Número de slides</p>
              <div className="flex flex-wrap gap-2">
                {[3, 4, 5, 6, 7, 8].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setSlideCount(n)}
                    className={`h-9 w-9 rounded-lg border text-sm font-medium transition ${
                      slideCount === n
                        ? "border-brand bg-brand/10 text-brand-2"
                        : "border-border bg-surface-2 hover:border-brand-2/50"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

          <button
            type="button"
            onClick={generate}
            disabled={loading}
            className="brand-gradient mt-5 w-full rounded-xl px-6 py-3 text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
          >
            {loading
              ? isCarousel
                ? "Gerando carrossel..."
                : "Gerando..."
              : isCarousel
                ? "✨ Gerar carrossel com IA"
                : "✨ Gerar com IA"}
          </button>
        </div>

        {/* right: preview */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <p className="mb-4 text-sm font-medium text-muted">Pré-visualização</p>
            <div className="flex justify-center">
              {isCarousel && carousel ? (
                <PosterPreview
                  brand={brand}
                  post={slidePost(carousel.slides[slideIndex], slideIndex)}
                  format={format}
                  width={previewWidth}
                  slideInfo={{
                    index: slideIndex + 1,
                    total: carousel.slides.length,
                  }}
                />
              ) : post ? (
                <PosterPreview
                  ref={posterRef}
                  brand={brand}
                  post={post}
                  format={format}
                  width={previewWidth}
                  offsets={offsets}
                  editable={editMode}
                  onOffsetsChange={setOffsets}
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

            {isCarousel && carousel && (
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setSlideIndex((i) => Math.max(0, i - 1))}
                  disabled={slideIndex === 0}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm transition hover:border-brand-2/50 disabled:opacity-40"
                >
                  ‹
                </button>
                <div className="flex gap-1.5">
                  {carousel.slides.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Slide ${i + 1}`}
                      onClick={() => setSlideIndex(i)}
                      className={`h-2.5 w-2.5 rounded-full transition ${
                        i === slideIndex ? "bg-brand" : "bg-border"
                      }`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSlideIndex((i) =>
                      Math.min(carousel.slides.length - 1, i + 1),
                    )
                  }
                  disabled={slideIndex === carousel.slides.length - 1}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm transition hover:border-brand-2/50 disabled:opacity-40"
                >
                  ›
                </button>
              </div>
            )}

            {isCarousel && carousel && (
              <>
                <div className="mt-5 flex gap-3">
                  <button
                    type="button"
                    onClick={downloadSlide}
                    disabled={downloading}
                    className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition hover:border-brand-2/50 disabled:opacity-50"
                  >
                    {downloading ? "Baixando..." : "Baixar este slide"}
                  </button>
                  <button
                    type="button"
                    onClick={downloadCarousel}
                    disabled={downloadingAll}
                    className="brand-gradient flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
                  >
                    {downloadingAll ? "Gerando..." : "⬇ Baixar carrossel (.zip)"}
                  </button>
                </div>
                <div className="mt-5 border-t border-border pt-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      Legenda para {NETWORK_LABELS[format.network]}
                    </p>
                    <button
                      type="button"
                      onClick={() => copyText(carousel.caption, "caption")}
                      className="text-xs font-medium text-brand-2 transition hover:opacity-80"
                    >
                      {copied === "caption" ? "Copiado!" : "Copiar"}
                    </button>
                  </div>
                  <p className="mt-2 whitespace-pre-line rounded-xl border border-border bg-surface-2 p-3 text-sm text-muted">
                    {carousel.caption}
                  </p>
                  {carousel.hashtags.length > 0 && (
                    <>
                      <div className="mt-4 flex items-center justify-between">
                        <p className="text-sm font-medium">Hashtags</p>
                        <button
                          type="button"
                          onClick={() =>
                            copyText(
                              carousel.hashtags.map((h) => `#${h}`).join(" "),
                              "hashtags",
                            )
                          }
                          className="text-xs font-medium text-brand-2 transition hover:opacity-80"
                        >
                          {copied === "hashtags" ? "Copiado!" : "Copiar"}
                        </button>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {carousel.hashtags.map((h) => (
                          <span
                            key={h}
                            className="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-xs text-brand-2"
                          >
                            #{h}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}

            {post && (
              <div className="mt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setEditMode((v) => !v)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                    editMode
                      ? "border-brand bg-brand/10 text-brand-2"
                      : "border-border bg-surface-2 hover:border-brand-2/50"
                  }`}
                >
                  {editMode ? "✓ Editando arte" : "✎ Editar arte"}
                </button>
                {editMode && (
                  <button
                    type="button"
                    onClick={() => setOffsets(EMPTY_OFFSETS)}
                    className="text-xs font-medium text-muted transition hover:text-foreground"
                  >
                    Resetar posições
                  </button>
                )}
              </div>
            )}

            {post && editMode && (
              <div className="mt-3 grid gap-3 rounded-xl border border-border bg-surface-2 p-4">
                <p className="text-xs text-muted">
                  Arraste o logo, o título e o botão direto na arte. Edite os
                  textos abaixo.
                </p>
                <label className="grid gap-1 text-xs font-medium">
                  Título
                  <input
                    value={post.headline}
                    onChange={(e) => updatePost({ headline: e.target.value })}
                    className="input"
                  />
                </label>
                <label className="grid gap-1 text-xs font-medium">
                  Palavra em destaque
                  <input
                    value={post.highlight}
                    onChange={(e) => updatePost({ highlight: e.target.value })}
                    placeholder="parte do título com cor de destaque"
                    className="input"
                  />
                </label>
                <label className="grid gap-1 text-xs font-medium">
                  Texto
                  <textarea
                    value={post.body}
                    onChange={(e) => updatePost({ body: e.target.value })}
                    rows={2}
                    className="input"
                  />
                </label>
                <label className="grid gap-1 text-xs font-medium">
                  Botão (CTA)
                  <input
                    value={post.cta}
                    onChange={(e) => updatePost({ cta: e.target.value })}
                    className="input"
                  />
                </label>
              </div>
            )}

            {post && (
              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={download}
                  disabled={downloading}
                  className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition hover:border-brand-2/50 disabled:opacity-50"
                >
                  {downloading ? "Aguarde..." : "Baixar PNG"}
                </button>
                <button
                  type="button"
                  onClick={sharePost}
                  disabled={downloading}
                  className="flex-1 rounded-xl border border-brand bg-brand/10 px-4 py-2.5 text-sm font-medium text-brand-2 transition hover:bg-brand/20 disabled:opacity-50"
                >
                  Compartilhar
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

            {post && (
              <button
                type="button"
                onClick={downloadAll}
                disabled={downloadingAll}
                className="mt-3 w-full rounded-xl border border-brand bg-brand/10 px-4 py-2.5 text-sm font-semibold text-brand-2 transition hover:bg-brand/20 disabled:opacity-50"
              >
                {downloadingAll
                  ? "Gerando pacote..."
                  : "⬇ Baixar para todas as redes (.zip)"}
              </button>
            )}

            {post?.caption && (
              <div className="mt-5 border-t border-border pt-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    Legenda para {NETWORK_LABELS[format.network]}
                  </p>
                  <button
                    type="button"
                    onClick={() => copyText(post.caption ?? "", "caption")}
                    className="text-xs font-medium text-brand-2 transition hover:opacity-80"
                  >
                    {copied === "caption" ? "Copiado!" : "Copiar"}
                  </button>
                </div>
                <p className="mt-2 whitespace-pre-line rounded-xl border border-border bg-surface-2 p-3 text-sm text-muted">
                  {post.caption}
                </p>

                {post.hashtags && post.hashtags.length > 0 && (
                  <>
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-sm font-medium">Hashtags</p>
                      <button
                        type="button"
                        onClick={() =>
                          copyText(
                            (post.hashtags ?? [])
                              .map((h) => `#${h}`)
                              .join(" "),
                            "hashtags",
                          )
                        }
                        className="text-xs font-medium text-brand-2 transition hover:opacity-80"
                      >
                        {copied === "hashtags" ? "Copiado!" : "Copiar"}
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {post.hashtags.map((h) => (
                        <span
                          key={h}
                          className="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-xs text-brand-2"
                        >
                          #{h}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {post && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: -99999,
            top: 0,
            opacity: 0,
            pointerEvents: "none",
          }}
        >
          {FORMATS.map((f) => (
            <PosterPreview
              key={f.id}
              ref={(el) => {
                exportRefs.current[f.id] = el;
              }}
              brand={brand}
              post={post}
              format={f}
              width={400}
              offsets={offsets}
            />
          ))}
        </div>
      )}

      {isCarousel && carousel && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: -99999,
            top: 0,
            opacity: 0,
            pointerEvents: "none",
          }}
        >
          {carousel.slides.map((slide, i) => (
            <PosterPreview
              key={i}
              ref={(el) => {
                slideRefs.current[i] = el;
              }}
              brand={brand}
              post={slidePost(slide, i)}
              format={format}
              width={400}
              slideInfo={{ index: i + 1, total: carousel.slides.length }}
            />
          ))}
        </div>
      )}
    </main>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={null}>
      <CreatePageInner />
    </Suspense>
  );
}
