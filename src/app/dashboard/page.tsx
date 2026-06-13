"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { PosterPreview } from "@/components/PosterPreview";
import { useBrand } from "@/lib/brand-context";
import { getFormat, FORMATS } from "@/lib/formats";

export default function DashboardPage() {
  const router = useRouter();
  const { brand, posts, ready, removePost } = useBrand();

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
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Olá, {brand.brandName || "marca"} 👋
            </h1>
            <p className="mt-1 text-muted">
              Crie conteúdo com a sua identidade visual em segundos.
            </p>
          </div>
          <Link
            href="/create"
            className="brand-gradient rounded-xl px-6 py-3 text-sm font-semibold transition hover:opacity-90"
          >
            + Criar conteúdo
          </Link>
        </div>

        {/* brand summary */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <SummaryCard label="Objetivo" value={brand.objective} />
          <SummaryCard
            label="Paleta"
            value={brand.palette.name}
            swatches={[
              brand.palette.primary,
              brand.palette.secondary,
              brand.palette.accent,
            ]}
          />
          <SummaryCard
            label="Formatos disponíveis"
            value={`${FORMATS.length} formatos`}
          />
        </div>

        <h2 className="mt-12 text-xl font-semibold">Suas criações</h2>
        {posts.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
            <p className="text-muted">
              Você ainda não criou nenhum conteúdo.
            </p>
            <Link
              href="/create"
              className="brand-gradient mt-4 inline-block rounded-xl px-6 py-3 text-sm font-semibold transition hover:opacity-90"
            >
              Criar meu primeiro post
            </Link>
          </div>
        ) : (
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => {
              const format = getFormat(post.formatId) ?? FORMATS[0];
              return (
                <div
                  key={post.id}
                  className="overflow-hidden rounded-2xl border border-border bg-surface"
                >
                  <div className="flex justify-center bg-black/30 p-4">
                    <PosterPreview
                      brand={brand}
                      post={post}
                      format={format}
                      width={240}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {post.topic}
                      </p>
                      <p className="text-xs text-muted">{format.name}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePost(post.id)}
                      className="rounded-lg border border-border px-3 py-1 text-xs text-muted transition hover:text-foreground"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  swatches,
}: {
  label: string;
  value: string;
  swatches?: string[];
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-lg font-semibold capitalize">{value}</p>
        {swatches && (
          <div className="flex gap-1">
            {swatches.map((c) => (
              <span
                key={c}
                className="h-5 w-5 rounded-full"
                style={{ background: c }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
