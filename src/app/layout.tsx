import type { Metadata } from "next";
import {
  Geist,
  Poppins,
  Playfair_Display,
  Montserrat,
  Inter,
  Lora,
} from "next/font/google";
import "./globals.css";
import { BrandProvider } from "@/lib/brand-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

const fontVariables = [
  geistSans.variable,
  poppins.variable,
  playfair.variable,
  montserrat.variable,
  inter.variable,
  lora.variable,
].join(" ");

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
    <html lang="pt-BR" className={`${fontVariables} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <BrandProvider>{children}</BrandProvider>
      </body>
    </html>
  );
}
