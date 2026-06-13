import type { ColorPalette } from "./types";

export const PALETTES: ColorPalette[] = [
  {
    id: "lavanda",
    name: "Lavanda",
    primary: "#7c3aed",
    secondary: "#a78bfa",
    accent: "#c4b5fd",
    background: "#0f0a1e",
    text: "#f5f3ff",
  },
  {
    id: "coral",
    name: "Coral Suave",
    primary: "#ef4444",
    secondary: "#f97316",
    accent: "#fb7185",
    background: "#1c0f0f",
    text: "#fff1f2",
  },
  {
    id: "por-do-sol",
    name: "Pôr do Sol",
    primary: "#f59e0b",
    secondary: "#f97316",
    accent: "#fbbf24",
    background: "#1a1206",
    text: "#fffbeb",
  },
  {
    id: "menta",
    name: "Menta",
    primary: "#10b981",
    secondary: "#14b8a6",
    accent: "#5eead4",
    background: "#06201a",
    text: "#ecfdf5",
  },
  {
    id: "oceano",
    name: "Oceano",
    primary: "#2563eb",
    secondary: "#0ea5e9",
    accent: "#38bdf8",
    background: "#0b1220",
    text: "#eff6ff",
  },
  {
    id: "grafite",
    name: "Grafite",
    primary: "#f8fafc",
    secondary: "#94a3b8",
    accent: "#facc15",
    background: "#0a0a0a",
    text: "#f8fafc",
  },
];

export const DEFAULT_PALETTE = PALETTES[0];
