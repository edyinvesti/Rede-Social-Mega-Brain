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
  connections: {
    instagram: boolean;
    facebook: boolean;
    linkedin: boolean;
  };
}

export type SocialNetwork =
  | "instagram"
  | "facebook"
  | "linkedin"
  | "whatsapp";

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

export interface GeneratedPost {
  id: string;
  formatId: string;
  topic: string;
  headline: string;
  highlight: string;
  body: string;
  cta: string;
  createdAt: number;
}
