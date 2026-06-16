"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { useBrand } from "@/lib/brand-context";
import { PALETTES } from "@/lib/palettes";
import { FONT_OPTIONS } from "@/lib/defaults";

function EditBrandModal({
  brand,
  updateBrand,
  onClose,
}: {
  brand: any;
  updateBrand: (patch: any) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"info" | "visual">("info");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Editar Marca</h2>
          <button onClick={onClose} className="text-muted hover:text-foreground text-lg">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab("info")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tab === "info" ? "bg-brand text-white" : "bg-surface-2 text-muted hover:text-foreground"}`}
          >
            Informações
          </button>
          <button
            onClick={() => setTab("visual")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tab === "visual" ? "bg-brand text-white" : "bg-surface-2 text-muted hover:text-foreground"}`}
          >
            Visual
          </button>
        </div>

        {tab === "info" && (
          <div className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium">Nome da marca</span>
              <input
                value={brand.brandName}
                onChange={(e) => updateBrand({ brandName: e.target.value })}
                className="input w-full"
                placeholder="Ex: IAmobil"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Descrição</span>
              <textarea
                value={brand.brandDescription}
                onChange={(e) => updateBrand({ brandDescription: e.target.value })}
                rows={3}
                className="input w-full"
                placeholder="O que sua marca faz"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Público-alvo</span>
              <textarea
                value={brand.audience}
                onChange={(e) => updateBrand({ audience: e.target.value })}
                rows={3}
                className="input w-full"
                placeholder="Quem é seu cliente ideal?"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Tom de voz</span>
              <textarea
                value={brand.toneOfVoice}
                onChange={(e) => updateBrand({ toneOfVoice: e.target.value })}
                rows={2}
                className="input w-full"
                placeholder="Ex: profissional, acolhedor"
              />
            </label>
          </div>
        )}

        {tab === "visual" && (
          <div className="space-y-5">
            <label className="block space-y-2">
              <span className="text-sm font-medium">Logo</span>
              <div className="flex items-center gap-4">
                {brand.logoDataUrl ? (
                  <img src={brand.logoDataUrl} alt="logo" className="h-16 w-16 rounded-xl bg-white/5 object-contain p-2" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-border text-2xl text-muted">+</div>
                )}
                <label className="cursor-pointer rounded-lg border border-border px-4 py-2 text-sm font-medium hover:border-brand-2/50">
                  {brand.logoDataUrl ? "Trocar logo" : "Enviar logo"}
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => updateBrand({ logoDataUrl: reader.result as string });
                    reader.readAsDataURL(file);
                  }} />
                </label>
              </div>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium">Cores da marca</span>
              <div className="grid grid-cols-3 gap-3">
                {PALETTES.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => updateBrand({ palette: p })}
                    className={`rounded-xl border p-3 transition ${brand.palette.id === p.id ? "border-brand" : "border-border hover:border-brand-2/50"}`}
                  >
                    <div className="flex justify-center gap-1">
                      {[p.primary, p.secondary, p.accent].map((c) => (
                        <span key={c} className="h-5 w-5 rounded-full" style={{ background: c }} />
                      ))}
                    </div>
                    <div className="mt-2 text-center text-xs text-muted">{p.name}</div>
                  </button>
                ))}
              </div>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium">Fonte dos títulos</span>
                <select value={brand.fontHeading} onChange={(e) => updateBrand({ fontHeading: e.target.value })} className="input w-full">
                  {FONT_OPTIONS.map((f) => <option key={f}>{f}</option>)}
                </select>
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium">Fonte dos textos</span>
                <select value={brand.fontBody} onChange={(e) => updateBrand({ fontBody: e.target.value })} className="input w-full">
                  {FONT_OPTIONS.map((f) => <option key={f}>{f}</option>)}
                </select>
              </label>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="brand-gradient mt-6 w-full rounded-xl px-6 py-3 text-sm font-semibold transition hover:opacity-90"
        >
          Salvar alterações
        </button>
      </div>
    </div>
  );
}

const CONTENT_TYPES = [
  {
    id: "image",
    title: "Posts de Imagens",
    credits: 10,
    description:
      "Crie posts únicos, carrosséis e stories prontos para publicar nas redes sociais.",
    href: "/create",
    badge: null,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 0 0 1.5-1.5V4.5a1.5 1.5 0 0 0-1.5-1.5H3.75a1.5 1.5 0 0 0-1.5 1.5v15a1.5 1.5 0 0 0 1.5 1.5Zm4.5-5.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
      </svg>
    ),
  },
  {
    id: "video",
    title: "Posts de Vídeo",
    credits: 0,
    description:
      "Gere Reels, Shorts e vídeos animados com IA, com cortes, legendas e trilha.",
    href: "/video",
    badge: "50%PRO",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
    ),
  },
  {
    id: "flyer",
    title: "Flyers / Panfletos",
    credits: 10,
    description:
      "Monte panfletos de promoções, eventos, cardápios e imóveis prontos para imprimir.",
    href: "/bestcontent",
    badge: null,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    ),
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const { brand, ready, updateBrand } = useBrand();
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (ready && !brand.completed) {
      router.replace("/onboarding");
    }
  }, [ready, brand.completed, router]);

  if (!ready) return null;

  return (
    <main className="flex-1">
      <AppNav />
      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Header com saudação e botão editar */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">
              Olá, {brand.brandName || "Marca"} 👋
            </h1>
            <p className="mt-1 text-lg text-muted">
              Crie conteúdo com a sua identidade visual em segundos.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="rounded-xl border border-border bg-surface-2 px-4 py-2 text-sm font-medium transition hover:border-brand-2/50"
          >
            ✏️ Editar Marca
          </button>
        </div>

        {/* Resumo da marca */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="text-xs font-medium text-muted">Objetivo</p>
            <p className="mt-1 text-sm font-semibold capitalize">{brand.objective}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="text-xs font-medium text-muted">Paleta</p>
            <div className="mt-1 flex items-center gap-2">
              <div className="flex gap-1">
                {[brand.palette.primary, brand.palette.secondary, brand.palette.accent].map((c) => (
                  <span key={c} className="h-4 w-4 rounded-full" style={{ background: c }} />
                ))}
              </div>
              <span className="text-sm font-semibold">{brand.palette.name}</span>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="text-xs font-medium text-muted">Formatos</p>
            <p className="mt-1 text-sm font-semibold">12 formatos</p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold">O que você quer criar?</h2>
          <p className="mt-2 text-muted">Escolha o tipo de conteúdo que deseja gerar com IA.</p>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {CONTENT_TYPES.map((type) => (
            <Link
              key={type.id}
              href={type.href}
              className="group relative flex flex-col rounded-2xl border border-border bg-surface p-6 transition hover:border-brand-2/50 hover:bg-surface-2"
            >
              {type.badge && (
                <span className="absolute right-4 top-4 rounded-full bg-brand/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-2">
                  {type.badge}
                </span>
              )}
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-surface-2 text-brand-2 transition group-hover:bg-brand/10">
                {type.icon}
              </div>
              <h2 className="text-lg font-semibold">{type.title}</h2>
              <p className="mt-1 text-sm font-medium text-brand-2">
                {type.credits} cr.
              </p>
              <p className="mt-3 flex-1 text-sm text-muted">
                {type.description}
              </p>
              <span className="mt-4 block text-center text-xs font-medium text-muted transition group-hover:text-foreground">
                ou comece do zero no editor
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Modal Editar Marca */}
      {editOpen && (
        <EditBrandModal brand={brand} updateBrand={updateBrand} onClose={() => setEditOpen(false)} />
      )}
    </main>
  );
}
