"use client";

import Link from "next/link";
import { useBrand } from "@/lib/brand-context";

const FEATURES = [
  {
    title: "Identidade aplicada sozinha",
    desc: "Logo, cores e tipografia da sua marca aplicados automaticamente em cada arte.",
  },
  {
    title: "IA escreve por você",
    desc: "Títulos, legendas e CTAs persuasivos gerados a partir do seu público e objetivo.",
  },
  {
    title: "Pronto para postar",
    desc: "Posts, carrosséis e stories no tamanho certo de cada rede social.",
  },
];

export default function Home() {
  const { brand, ready } = useBrand();
  const ctaHref = ready && brand.completed ? "/dashboard" : "/onboarding";

  return (
    <main className="flex-1">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="brand-gradient flex h-9 w-9 items-center justify-center rounded-xl font-black">
            C
          </div>
          <span className="text-lg font-bold">Content AI Studio</span>
        </div>
        <Link
          href={ctaHref}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition hover:text-foreground"
        >
          Entrar
        </Link>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-20 pt-10 text-center">
        <span className="inline-block rounded-full border border-border bg-surface px-4 py-1 text-xs font-medium text-brand-2">
          Conteúdo com IA, sem contratar designer
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-5xl font-extrabold leading-tight sm:text-6xl">
          Quer vender mais nas redes{" "}
          <span className="text-gradient">sem perder tempo</span> criando
          conteúdo?
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">
          O Content AI Studio aprende a identidade da sua marca e gera posts,
          carrosséis e stories prontos para publicar em segundos.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href={ctaHref}
            className="brand-gradient rounded-xl px-8 py-4 text-base font-semibold shadow-lg shadow-brand/30 transition hover:opacity-90"
          >
            {brand.completed ? "Ir para o painel" : "Começar agora"}
          </Link>
        </div>

        <div className="mt-20 grid gap-6 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border bg-surface p-6 text-left"
            >
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
