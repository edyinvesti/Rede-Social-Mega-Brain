"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { useBrand } from "@/lib/brand-context";
import { TEMPLATE_NICHES } from "@/lib/templates";
import { upcomingOccasions } from "@/lib/occasions";
import { NETWORK_LABELS, type SocialNetwork } from "@/lib/types";
import type { CalendarIdea, CalendarResult } from "@/lib/generate-copy";

const NETWORK_EMOJI: Record<SocialNetwork, string> = {
  instagram: "📸",
  facebook: "👍",
  linkedin: "💼",
  whatsapp: "💬",
  tiktok: "🎵",
  youtube: "▶️",
  kwai: "⚡",
  x: "🐦",
  pinterest: "📌",
};

export default function CalendarPage() {
  const router = useRouter();
  const { brand, ready } = useBrand();
  const [nicheLabel, setNicheLabel] = useState(TEMPLATE_NICHES[0].label);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CalendarResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ready && !brand.completed) router.replace("/onboarding");
  }, [ready, brand.completed, router]);

  const occasions = useMemo(() => upcomingOccasions().slice(0, 6), []);

  const generate = async () => {
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niche: nicheLabel,
          days: 7,
          occasions: occasions.map((o) => o.label),
          brand: {
            brandName: brand.brandName,
            brandDescription: brand.brandDescription,
            objective: brand.objective,
            audience: brand.audience,
            toneOfVoice: brand.toneOfVoice,
          },
        }),
      });
      if (!res.ok) throw new Error("Falha");
      setResult((await res.json()) as CalendarResult);
    } catch {
      setError("Não foi possível gerar a pauta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (!ready) return null;

  return (
    <main className="flex-1">
      <AppNav />
      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-2xl font-bold">Pauta da semana</h1>
        <p className="mt-1 text-muted">
          A IA sugere temas de conteúdo por nicho e datas comemorativas. Clique
          em uma ideia para já criar a arte.
        </p>

        {occasions.length > 0 && (
          <div className="mt-6 rounded-2xl border border-border bg-surface p-4">
            <p className="text-sm font-semibold">Datas comemorativas a caminho</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {occasions.map((o) => (
                <Link
                  key={o.label}
                  href={`/create?topic=${encodeURIComponent(o.label)}`}
                  className="rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium transition hover:border-brand-2/50"
                >
                  {o.label}
                  <span className="ml-1.5 text-muted">
                    {o.inDays === 0 ? "hoje" : `em ${o.inDays}d`}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="grid flex-1 gap-1 text-sm font-medium">
            Nicho
            <select
              value={nicheLabel}
              onChange={(e) => setNicheLabel(e.target.value)}
              className="input"
            >
              {TEMPLATE_NICHES.map((n) => (
                <option key={n.id} value={n.label}>
                  {n.emoji} {n.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={generate}
            disabled={loading}
            className="brand-gradient rounded-xl px-5 py-2.5 text-sm font-semibold transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Gerando pauta..." : "✨ Gerar pauta da semana"}
          </button>
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </p>
        )}

        {result && (
          <div className="mt-6 grid gap-3">
            {result.ideas.map((idea: CalendarIdea, i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4"
              >
                <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-surface-2 text-center">
                  <span className="text-[10px] uppercase text-muted">
                    {idea.day.slice(0, 3)}
                  </span>
                  <span className="text-lg leading-none">
                    {NETWORK_EMOJI[idea.network]}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{idea.title}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {idea.format} · {NETWORK_LABELS[idea.network]}
                  </p>
                </div>
                <Link
                  href={`/create?topic=${encodeURIComponent(idea.title)}`}
                  className="shrink-0 rounded-lg border border-brand bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand-2 transition hover:bg-brand/20"
                >
                  Criar
                </Link>
              </div>
            ))}
            {result.source === "stub" && (
              <p className="text-center text-xs text-muted">
                Pauta gerada em modo demo (configure a IA para sugestões
                personalizadas).
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
