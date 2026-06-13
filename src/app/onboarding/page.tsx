"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useBrand } from "@/lib/brand-context";
import { PALETTES } from "@/lib/palettes";
import { FONT_OPTIONS } from "@/lib/defaults";
import { fileToDataUrl, LogoTooLargeError } from "@/lib/logo-upload";
import type { Objective, SocialNetwork } from "@/lib/types";
import { NETWORK_LABELS } from "@/lib/types";

const STEPS = [
  "Objetivo",
  "Marca",
  "Público",
  "Identidade",
  "Estilo",
  "Conexões",
];

const OBJECTIVES: { id: Objective; label: string; desc: string }[] = [
  { id: "vendas", label: "Vender mais", desc: "Aumentar vendas e conversões" },
  { id: "autoridade", label: "Autoridade", desc: "Ser referência no nicho" },
  { id: "engajamento", label: "Engajamento", desc: "Mais curtidas e comentários" },
  { id: "leads", label: "Gerar leads", desc: "Captar contatos qualificados" },
  { id: "trafego", label: "Tráfego", desc: "Levar pessoas para o site" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { brand, updateBrand } = useBrand();
  const [step, setStep] = useState(0);
  const [logoError, setLogoError] = useState<string | null>(null);

  const canContinue = useMemo(() => {
    switch (step) {
      case 0:
        return Boolean(brand.objective);
      case 1:
        return brand.brandName.trim().length > 1;
      case 2:
        return brand.audience.trim().length > 3;
      default:
        return true;
    }
  }, [step, brand]);

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      updateBrand({ completed: true });
      router.push("/dashboard");
    }
  };
  const back = () => setStep((s) => Math.max(0, s - 1));

  const handleLogo = async (file: File | undefined) => {
    if (!file) return;
    setLogoError(null);
    try {
      const dataUrl = await fileToDataUrl(file);
      updateBrand({ logoDataUrl: dataUrl });
    } catch (err) {
      setLogoError(
        err instanceof LogoTooLargeError
          ? err.message
          : "Não foi possível carregar o logo. Tente outra imagem.",
      );
    }
  };

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="mb-2 flex items-center gap-2">
          <div className="brand-gradient flex h-7 w-7 items-center justify-center rounded-lg text-sm font-black">
            C
          </div>
          <span className="text-sm font-semibold text-muted">
            Configure sua conta em 6 passos simples
          </span>
        </div>

        {/* progress */}
        <div className="mb-8 mt-4">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
            <div
              className="brand-gradient h-full rounded-full transition-all"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {STEPS.map((label, i) => (
              <span
                key={label}
                className={
                  i === step
                    ? "font-semibold text-brand-2"
                    : i < step
                      ? "text-foreground"
                      : "text-muted"
                }
              >
                {i + 1}. {label}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
          {step === 0 && (
            <Section
              title="Qual é o seu objetivo?"
              subtitle="O que você quer alcançar com o conteúdo?"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {OBJECTIVES.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => updateBrand({ objective: o.id })}
                    className={`rounded-xl border p-4 text-left transition ${
                      brand.objective === o.id
                        ? "border-brand bg-brand/10"
                        : "border-border bg-surface-2 hover:border-brand-2/50"
                    }`}
                  >
                    <div className="font-semibold">{o.label}</div>
                    <div className="text-sm text-muted">{o.desc}</div>
                  </button>
                ))}
              </div>
              <Field label="Conte mais sobre a sua meta (opcional)">
                <textarea
                  value={brand.goalDescription}
                  onChange={(e) =>
                    updateBrand({ goalDescription: e.target.value })
                  }
                  rows={3}
                  placeholder="Ex: quero lotar minha agenda de atendimentos no próximo mês"
                  className="input"
                />
              </Field>
            </Section>
          )}

          {step === 1 && (
            <Section
              title="Sobre a sua marca"
              subtitle="Vamos identificar quem é você."
            >
              <Field label="Nome da marca">
                <input
                  value={brand.brandName}
                  onChange={(e) => updateBrand({ brandName: e.target.value })}
                  placeholder="Ex: CareHub"
                  className="input"
                />
              </Field>
              <Field label="Descrição da marca">
                <textarea
                  value={brand.brandDescription}
                  onChange={(e) =>
                    updateBrand({ brandDescription: e.target.value })
                  }
                  rows={3}
                  placeholder="O que sua marca faz e qual problema resolve"
                  className="input"
                />
              </Field>
              <Field label="Logo (opcional)">
                <div className="flex items-center gap-4">
                  {brand.logoDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={brand.logoDataUrl}
                      alt="logo"
                      className="h-16 w-16 rounded-xl bg-white/5 object-contain p-2"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-border text-2xl text-muted">
                      +
                    </div>
                  )}
                  <label className="cursor-pointer rounded-lg border border-border px-4 py-2 text-sm font-medium hover:border-brand-2/50">
                    {brand.logoDataUrl ? "Trocar logo" : "Enviar logo"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleLogo(e.target.files?.[0])}
                    />
                  </label>
                </div>
                {logoError && (
                  <p className="mt-2 text-sm text-red-400">{logoError}</p>
                )}
              </Field>
            </Section>
          )}

          {step === 2 && (
            <Section
              title="Quem é seu público-alvo?"
              subtitle="Descreva as pessoas que você quer alcançar."
            >
              <Field label="Quem é o cliente ideal?">
                <textarea
                  value={brand.audience}
                  onChange={(e) => updateBrand({ audience: e.target.value })}
                  rows={4}
                  placeholder="Idade, gênero, localização, profissão, estilo de vida"
                  className="input"
                />
              </Field>
            </Section>
          )}

          {step === 3 && (
            <Section
              title="Identidade e tom de voz"
              subtitle="Como sua marca fala com as pessoas?"
            >
              <Field label="Tom de voz">
                <textarea
                  value={brand.toneOfVoice}
                  onChange={(e) =>
                    updateBrand({ toneOfVoice: e.target.value })
                  }
                  rows={3}
                  placeholder="Ex: acolhedor, próximo e inspirador; sem jargões técnicos"
                  className="input"
                />
              </Field>
            </Section>
          )}

          {step === 4 && (
            <Section
              title="Estilo visual da marca"
              subtitle="Defina a identidade visual para suas criações."
            >
              <Field label="Cores da marca">
                <div className="grid grid-cols-3 gap-3">
                  {PALETTES.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => updateBrand({ palette: p })}
                      className={`rounded-xl border p-3 transition ${
                        brand.palette.id === p.id
                          ? "border-brand"
                          : "border-border hover:border-brand-2/50"
                      }`}
                    >
                      <div className="flex justify-center gap-1">
                        {[p.primary, p.secondary, p.accent].map((c) => (
                          <span
                            key={c}
                            className="h-5 w-5 rounded-full"
                            style={{ background: c }}
                          />
                        ))}
                      </div>
                      <div className="mt-2 text-center text-xs text-muted">
                        {p.name}
                      </div>
                    </button>
                  ))}
                </div>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Fonte dos títulos">
                  <select
                    value={brand.fontHeading}
                    onChange={(e) =>
                      updateBrand({ fontHeading: e.target.value })
                    }
                    className="input"
                  >
                    {FONT_OPTIONS.map((f) => (
                      <option key={f}>{f}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Fonte dos textos">
                  <select
                    value={brand.fontBody}
                    onChange={(e) => updateBrand({ fontBody: e.target.value })}
                    className="input"
                  >
                    {FONT_OPTIONS.map((f) => (
                      <option key={f}>{f}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Descrição do estilo visual (opcional)">
                <textarea
                  value={brand.styleDescription}
                  onChange={(e) =>
                    updateBrand({ styleDescription: e.target.value })
                  }
                  rows={3}
                  placeholder="Ex: tipografia robusta, blocos coesos, alto contraste"
                  className="input"
                />
              </Field>
            </Section>
          )}

          {step === 5 && (
            <Section
              title="Conecte suas redes sociais"
              subtitle="Você pode pular esta etapa e conectar depois."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {(Object.keys(NETWORK_LABELS) as SocialNetwork[]).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() =>
                      updateBrand({
                        connections: {
                          ...brand.connections,
                          [n]: !brand.connections[n],
                        },
                      })
                    }
                    className={`flex items-center justify-between rounded-xl border p-4 transition ${
                      brand.connections[n]
                        ? "border-brand bg-brand/10"
                        : "border-border bg-surface-2 hover:border-brand-2/50"
                    }`}
                  >
                    <span className="font-medium">{NETWORK_LABELS[n]}</span>
                    <span className="text-sm text-muted">
                      {brand.connections[n] ? "Conectado" : "Conectar"}
                    </span>
                  </button>
                ))}
              </div>
            </Section>
          )}

          <div className="mt-8 flex items-center justify-between">
            <button
              type="button"
              onClick={back}
              disabled={step === 0}
              className="text-sm text-muted transition hover:text-foreground disabled:opacity-0"
            >
              ← Voltar
            </button>
            <button
              type="button"
              onClick={next}
              disabled={!canContinue}
              className="brand-gradient rounded-xl px-6 py-3 text-sm font-semibold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {step === STEPS.length - 1 ? "Concluir" : "Continuar →"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="mt-1 text-sm text-muted">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}
