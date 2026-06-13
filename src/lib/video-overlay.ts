/**
 * Draws the brand overlay (logo, brand name, headline with highlight and CTA)
 * on top of a video frame already painted to the canvas. Everything is sized
 * proportionally to the canvas width so it works for any aspect ratio.
 */

const FONT_VARS: Record<string, string> = {
  Geist: "--font-geist-sans",
  Poppins: "--font-poppins",
  "Playfair Display": "--font-playfair",
  Montserrat: "--font-montserrat",
  Inter: "--font-inter",
  Lora: "--font-lora",
};

/** Resolves a brand font name to a canvas-usable font-family string. */
export function canvasFontFamily(name: string): string {
  const varName = FONT_VARS[name];
  if (varName && typeof window !== "undefined") {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(varName)
      .trim();
    if (value) return `${value}, system-ui, sans-serif`;
  }
  return `${name}, system-ui, sans-serif`;
}

export interface OverlayInput {
  width: number;
  height: number;
  brandName: string;
  palettePrimary: string;
  paletteAccent: string;
  ctaTextColor: string;
  headline: string;
  highlight?: string;
  cta: string;
  fontFamily: string;
  logo: HTMLImageElement | null;
}

function norm(word: string): string {
  return word.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}

function highlightSet(highlight?: string): Set<string> {
  if (!highlight) return new Set();
  return new Set(
    highlight
      .split(/\s+/)
      .map(norm)
      .filter(Boolean),
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function layoutWords(
  ctx: CanvasRenderingContext2D,
  words: string[],
  maxWidth: number,
  spaceWidth: number,
): string[][] {
  const lines: string[][] = [];
  let current: string[] = [];
  let currentWidth = 0;
  for (const word of words) {
    const w = ctx.measureText(word).width;
    if (current.length > 0 && currentWidth + spaceWidth + w > maxWidth) {
      lines.push(current);
      current = [word];
      currentWidth = w;
    } else {
      if (current.length > 0) currentWidth += spaceWidth;
      current.push(word);
      currentWidth += w;
    }
  }
  if (current.length > 0) lines.push(current);
  return lines;
}

export function drawOverlay(
  ctx: CanvasRenderingContext2D,
  i: OverlayInput,
): void {
  const W = i.width;
  const H = i.height;
  const pad = W * 0.06;

  // Bottom gradient for headline/CTA legibility.
  const gh = H * 0.55;
  const g = ctx.createLinearGradient(0, H - gh, 0, H);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.85)");
  ctx.fillStyle = g;
  ctx.fillRect(0, H - gh, W, gh);

  // Top gradient for the logo/brand row.
  const th = H * 0.22;
  const tg = ctx.createLinearGradient(0, 0, 0, th);
  tg.addColorStop(0, "rgba(0,0,0,0.5)");
  tg.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = tg;
  ctx.fillRect(0, 0, W, th);

  // Logo + brand name (top-left).
  const top = pad;
  const logoBox = W * 0.12;
  let brandX = pad;
  let rowHeight = logoBox * 0.6;
  if (i.logo && i.logo.width > 0) {
    const ratio = i.logo.height / i.logo.width;
    let dw = logoBox;
    let dh = logoBox * ratio;
    if (dh > logoBox) {
      dh = logoBox;
      dw = logoBox / ratio;
    }
    ctx.drawImage(i.logo, pad, top, dw, dh);
    brandX = pad + dw + W * 0.03;
    rowHeight = dh;
  }
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = W * 0.01;
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "middle";
  ctx.font = `600 ${W * 0.05}px ${i.fontFamily}`;
  if (i.brandName) ctx.fillText(i.brandName, brandX, top + rowHeight / 2);
  ctx.restore();

  // CTA pill (bottom-left).
  const ctaFont = W * 0.052;
  ctx.font = `700 ${ctaFont}px ${i.fontFamily}`;
  const ctaText = i.cta || "";
  const ctaTextW = ctx.measureText(ctaText).width;
  const ctaPadX = W * 0.05;
  const ctaH = W * 0.12;
  const ctaY = H - pad - ctaH;
  const ctaX = pad;
  const pillW = ctaTextW + ctaPadX * 2;
  if (ctaText) {
    roundRect(ctx, ctaX, ctaY, pillW, ctaH, ctaH / 2);
    ctx.fillStyle = i.palettePrimary;
    ctx.fill();
    ctx.fillStyle = i.ctaTextColor;
    ctx.textBaseline = "middle";
    ctx.fillText(ctaText, ctaX + ctaPadX, ctaY + ctaH / 2);
  }

  // Headline (wrapped, with highlighted words) above the CTA.
  ctx.textBaseline = "alphabetic";
  const hFont = W * 0.082;
  ctx.font = `800 ${hFont}px ${i.fontFamily}`;
  const lineH = hFont * 1.12;
  const maxW = W - pad * 2;
  const spaceW = ctx.measureText(" ").width;
  const words = (i.headline || "").split(/\s+/).filter(Boolean);
  const lines = layoutWords(ctx, words, maxW, spaceW);
  const blockH = lines.length * lineH;
  let baseY = ctaY - W * 0.05 - blockH + hFont;
  const hset = highlightSet(i.highlight);
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = W * 0.012;
  ctx.shadowOffsetY = W * 0.004;
  for (const line of lines) {
    let x = pad;
    for (const word of line) {
      ctx.fillStyle = hset.has(norm(word)) ? i.paletteAccent : "#ffffff";
      ctx.fillText(word, x, baseY);
      x += ctx.measureText(word).width + spaceW;
    }
    baseY += lineH;
  }
  ctx.restore();
}
