export type Objective =
  | "vendas"
  | "autoridade"
  | "engajamento"
  | "leads"
  | "trafego";

export interface ColorPalette {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export interface BrandProfile {
  /** Onboarding completion flag */
  completed: boolean;
  /** Step 1 - Objetivo */
  objective: Objective;
  goalDescription: string;
  /** Step 2 - Marca */
  brandName: string;
  brandDescription: string;
  logoDataUrl: string | null;
  /** Step 3 - Público */
  audience: string;
  /** Step 4 - Identidade (tom de voz) */
  toneOfVoice: string;
  /** Step 5 - Estilo visual */
  palette: ColorPalette;
  styleDescription: string;
  fontHeading: string;
  fontBody: string;
  /** Step 6 - Conexões */
  connections: Partial<Record<SocialNetwork, boolean>>;
}

export type SocialNetwork =
  | "instagram"
  | "facebook"
  | "linkedin"
  | "whatsapp"
  | "tiktok"
  | "youtube"
  | "kwai"
  | "x"
  | "pinterest";

export const NETWORK_LABELS: Record<SocialNetwork, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  whatsapp: "WhatsApp",
  tiktok: "TikTok",
  youtube: "YouTube",
  kwai: "Kwai",
  x: "X (Twitter)",
  pinterest: "Pinterest",
};

export interface ContentFormat {
  id: string;
  name: string;
  network: SocialNetwork;
  width: number;
  height: number;
  /** aspect ratio label, e.g. "1080 x 1350px" */
  sizeLabel: string;
  description: string;
  top?: boolean;
}

/** Position offsets per poster element, as a fraction of the poster width. */
export interface PosterOffsets {
  logo: { x: number; y: number };
  headline: { x: number; y: number };
  cta: { x: number; y: number };
}

export interface GeneratedPost {
  id: string;
  formatId: string;
  topic: string;
  headline: string;
  highlight: string;
  body: string;
  cta: string;
  caption?: string;
  hashtags?: string[];
  offsets?: PosterOffsets;
  createdAt: number;
  /** English prompt describing the scene for AI image generation */
  backgroundPrompt?: string;
  /** Cut-out product image (base64) */
  foregroundImage?: string;
  /** AI Generated background image (base64) */
  backgroundImage?: string;
}
