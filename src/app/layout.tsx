import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { BrandProvider } from "@/lib/brand-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Content AI Studio — Conteúdo para redes sociais com IA",
  description:
    "Crie posts, carrosséis e stories com a identidade da sua marca em segundos, sem contratar designer.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <BrandProvider>{children}</BrandProvider>
      </body>
    </html>
  );
}
