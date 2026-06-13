"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { useBrand } from "@/lib/brand-context";
import { FORMATS, getFormat } from "@/lib/formats";
import { contrastColor } from "@/lib/palettes";
import { canvasFontFamily, drawOverlay } from "@/lib/video-overlay";
import type { CopyResult } from "@/lib/generate-copy";
import { NETWORK_LABELS } from "@/lib/types";

interface MediaElementWithCapture extends HTMLVideoElement {
  captureStream?: () => MediaStream;
}

const DEFAULT_FORMAT =
  FORMATS.find((f) => f.id === "tiktok-video")?.id ?? FORMATS[0].id;

function pickMimeType(): string | undefined {
  const candidates = [
    "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
    "video/mp4;codecs=avc1,mp4a.40.2",
    "video/mp4;codecs=avc1,opus",
    "video/mp4;codecs=avc1",
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  if (typeof MediaRecorder === "undefined") return undefined;
  return candidates.find((c) => MediaRecorder.isTypeSupported(c));
}

export default function VideoPage() {
  const router = useRouter();
  const { brand, ready } = useBrand();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logoRef = useRef<HTMLImageElement | null>(null);

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [formatId, setFormatId] = useState(DEFAULT_FORMAT);
  const [topic, setTopic] = useState("");
  const [post, setPost] = useState<CopyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [aiEnabled, setAiEnabled] = useState<boolean | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"caption" | "hashtags" | null>(null);

  const format = getFormat(formatId) ?? FORMATS[0];

  useEffect(() => {
    if (ready && !brand.completed) router.replace("/onboarding");
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

  // Load the brand logo as an image for canvas drawing. The continuous draw
  // loop reads logoRef.current each frame, so no re-render is needed.
  useEffect(() => {
    if (!brand.logoDataUrl) {
      logoRef.current = null;
      return;
    }
    const img = new Image();
    img.onload = () => {
      logoRef.current = img;
    };
    img.src = brand.logoDataUrl;
  }, [brand.logoDataUrl]);

  // Continuous draw loop: paints the current video frame + overlay.
  useEffect(() => {
    if (!videoUrl) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const targetW = Math.min(format.width, 720);
    canvas.width = targetW;
    canvas.height = Math.round((targetW * format.height) / format.width);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const draw = () => {
      const cw = canvas.width;
      const ch = canvas.height;
      ctx.clearRect(0, 0, cw, ch);
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (vw > 0 && vh > 0) {
        const scale = Math.max(cw / vw, ch / vh);
        const dw = vw * scale;
        const dh = vh * scale;
        ctx.drawImage(video, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
      } else {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, cw, ch);
      }
      if (post) {
        drawOverlay(ctx, {
          width: cw,
          height: ch,
          brandName: brand.brandName,
          palettePrimary: brand.palette.primary,
          paletteAccent: brand.palette.accent,
          ctaTextColor: contrastColor(brand.palette.primary),
          headline: post.headline,
          highlight: post.highlight,
          cta: post.cta,
          fontFamily: canvasFontFamily(brand.fontHeading),
          logo: logoRef.current,
        });
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [videoUrl, post, format, brand]);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      setError("Selecione um arquivo de vídeo.");
      return;
    }
    setError(null);
    setVideoUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  const generate = async () => {
    if (!topic.trim()) {
      setError("Descreva o tema do vídeo.");
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
      setPost((await res.json()) as CopyResult);
    } catch {
      setError("Não foi possível gerar o conteúdo. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const play = () => {
    const v = videoRef.current;
    if (!v) return;
    v.loop = true;
    v.muted = true;
    v.currentTime = 0;
    void v.play();
  };

  const exportVideo = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    setExporting(true);
    try {
      if ("fonts" in document) await document.fonts.ready;
      const fps = 30;
      const stream = canvas.captureStream(fps);
      const cap = video as MediaElementWithCapture;
      video.muted = false;
      if (cap.captureStream) {
        const vs = cap.captureStream();
        vs.getAudioTracks().forEach((t) => stream.addTrack(t));
      }
      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      const stopped = new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
      });
      video.loop = false;
      video.currentTime = 0;
      await video.play();
      recorder.start();
      const onEnded = () => recorder.stop();
      video.addEventListener("ended", onEnded, { once: true });
      await stopped;
      video.removeEventListener("ended", onEnded);
      const recordedType = recorder.mimeType || mimeType || "video/webm";
      const isMp4 = recordedType.includes("mp4");
      const blob = new Blob(chunks, { type: recordedType });
      const ext = isMp4 ? "mp4" : "webm";
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `${brand.brandName || "video"}-${format.id}.${ext}`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Não foi possível exportar o vídeo. Tente um arquivo menor.");
    } finally {
      setExporting(false);
    }
  };

  const copyText = async (text: string, which: "caption" | "hashtags") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setError("Não foi possível copiar. Copie manualmente.");
    }
  };

  if (!ready) return null;

  const previewWidth = format.height > format.width ? 300 : 420;

  return (
    <main className="flex-1">
      <AppNav />
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[1fr_460px]">
        {/* left: controls */}
        <div>
          <h1 className="text-2xl font-bold">Criar vídeo (UGC)</h1>
          <p className="mt-1 text-muted">
            Suba um vídeo seu (ou de IA), a IA escreve o texto e aplicamos a sua
            marca por cima — pronto para postar.
          </p>

          {aiEnabled === false && (
            <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300">
              Modo demo: configure <code>GEMINI_API_KEY</code> ou{" "}
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
            <p className="mb-3 text-sm font-medium">1. Seu vídeo</p>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-2 p-6 text-center text-sm text-muted transition hover:border-brand-2/50">
              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              {videoUrl
                ? "Vídeo carregado. Clique para trocar."
                : "Clique para enviar um vídeo (MP4, MOV, WebM…)"}
            </label>
          </div>

          <div className="mt-6">
            <p className="mb-3 text-sm font-medium">2. Formato</p>
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
                  <span className="text-sm font-semibold">{f.name}</span>
                  <span className="mt-0.5 block text-xs font-medium text-brand-2">
                    {NETWORK_LABELS[f.network]}
                  </span>
                  <span className="text-xs text-muted">{f.sizeLabel}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <label className="block space-y-2">
              <span className="text-sm font-medium">3. Tema do vídeo</span>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={3}
                placeholder="Ex: bastidores do nosso produto + chamada para seguir"
                className="w-full rounded-xl border border-border bg-surface-2 p-3 text-sm outline-none transition focus:border-brand-2"
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
            {loading ? "Gerando..." : "✨ Gerar texto da marca"}
          </button>
        </div>

        {/* right: preview */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <p className="mb-4 text-sm font-medium text-muted">
              Pré-visualização
            </p>
            <div className="flex justify-center">
              {videoUrl ? (
                <canvas
                  ref={canvasRef}
                  onClick={play}
                  className="cursor-pointer rounded-lg"
                  style={{ width: previewWidth, height: "auto" }}
                />
              ) : (
                <div
                  className="flex items-center justify-center rounded-lg border border-dashed border-border text-center text-sm text-muted"
                  style={{
                    width: previewWidth,
                    height: (previewWidth * format.height) / format.width,
                  }}
                >
                  Suba um vídeo para ver a prévia.
                </div>
              )}
            </div>

            {videoUrl && (
              <p className="mt-2 text-center text-xs text-muted">
                Clique na prévia para reproduzir.
              </p>
            )}

            {videoUrl && (
              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={play}
                  className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition hover:border-brand-2/50"
                >
                  ▶ Reproduzir
                </button>
                <button
                  type="button"
                  onClick={exportVideo}
                  disabled={exporting}
                  className="brand-gradient flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
                >
                  {exporting ? "Exportando..." : "⬇ Exportar vídeo"}
                </button>
              </div>
            )}

            {post?.caption && (
              <div className="mt-5 border-t border-border pt-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    Legenda para {NETWORK_LABELS[format.network]}
                  </p>
                  <button
                    type="button"
                    onClick={() => copyText(post.caption, "caption")}
                    className="text-xs font-medium text-brand-2 transition hover:opacity-80"
                  >
                    {copied === "caption" ? "Copiado!" : "Copiar"}
                  </button>
                </div>
                <p className="mt-2 whitespace-pre-line rounded-xl border border-border bg-surface-2 p-3 text-sm text-muted">
                  {post.caption}
                </p>

                {post.hashtags.length > 0 && (
                  <>
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-sm font-medium">Hashtags</p>
                      <button
                        type="button"
                        onClick={() =>
                          copyText(
                            post.hashtags.map((h) => `#${h}`).join(" "),
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

      <video
        ref={videoRef}
        src={videoUrl ?? undefined}
        playsInline
        crossOrigin="anonymous"
        className="hidden"
      />
    </main>
  );
}
