/**
 * Maps a font display name (as stored in the brand profile) to a CSS
 * font-family stack backed by the CSS variables defined in layout.tsx.
 * The fonts themselves are loaded via next/font/google there.
 */
export const FONT_STACKS: Record<string, string> = {
  Geist: "var(--font-geist-sans), system-ui, sans-serif",
  Poppins: "var(--font-poppins), system-ui, sans-serif",
  "Playfair Display": "var(--font-playfair), Georgia, serif",
  Montserrat: "var(--font-montserrat), system-ui, sans-serif",
  Inter: "var(--font-inter), system-ui, sans-serif",
  Lora: "var(--font-lora), Georgia, serif",
};

export function fontStack(name: string): string {
  return FONT_STACKS[name] ?? `${name}, system-ui, sans-serif`;
}
