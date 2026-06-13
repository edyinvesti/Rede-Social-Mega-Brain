"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBrand } from "@/lib/brand-context";

const LINKS = [
  { href: "/dashboard", label: "Painel" },
  { href: "/create", label: "Criar" },
];

export function AppNav() {
  const pathname = usePathname();
  const { brand } = useBrand();

  return (
    <header className="border-b border-border bg-surface/60 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="brand-gradient flex h-8 w-8 items-center justify-center rounded-lg font-black">
              C
            </div>
            <span className="font-bold">Content AI Studio</span>
          </Link>
          <nav className="flex items-center gap-1">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  pathname === l.href
                    ? "bg-surface-2 text-foreground"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted">
          {brand.logoDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={brand.logoDataUrl}
              alt={brand.brandName}
              className="h-7 w-7 rounded-md bg-white/5 object-contain p-0.5"
            />
          ) : (
            <div
              className="flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold"
              style={{ background: brand.palette.primary }}
            >
              {(brand.brandName || "M").charAt(0).toUpperCase()}
            </div>
          )}
          <span className="hidden sm:inline">{brand.brandName || "Marca"}</span>
        </div>
      </div>
    </header>
  );
}
