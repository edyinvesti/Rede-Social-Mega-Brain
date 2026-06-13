import type { BrandProfile } from "./types";
import { DEFAULT_PALETTE } from "./palettes";

export const FONT_OPTIONS = [
  "Geist",
  "Poppins",
  "Playfair Display",
  "Montserrat",
  "Inter",
  "Lora",
];

export const DEFAULT_BRAND: BrandProfile = {
  completed: false,
  objective: "vendas",
  goalDescription: "",
  brandName: "",
  brandDescription: "",
  logoDataUrl: null,
  audience: "",
  toneOfVoice: "",
  palette: DEFAULT_PALETTE,
  styleDescription: "",
  fontHeading: "Poppins",
  fontBody: "Inter",
  connections: {
    instagram: false,
    facebook: false,
    linkedin: false,
  },
};

export const STORAGE_KEY = "content-ai-studio:brand";
export const POSTS_KEY = "content-ai-studio:posts";
