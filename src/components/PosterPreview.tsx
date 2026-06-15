"use client";

import { forwardRef, useRef } from "react";
import type {
  BrandProfile,
  ContentFormat,
  GeneratedPost,
  PosterOffsets,
} from "@/lib/types";
import { contrastColor } from "@/lib/palettes";
import { fontStack } from "@/lib/fonts";

export type { PosterOffsets };
export type PosterElement = "logo" | "headline" | "cta";

export const EMPTY_OFFSETS: PosterOffsets = {
  logo: { x: 0, y: 0 },
  headline: { x: 0, y: 0 },
  cta: { x: 0, y: 0 },
};

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

interface PosterPreviewProps {
  brand: BrandProfile;
  post: GeneratedPost;
  format: ContentFormat;
  /** rendered display width in px */
  width: number;
  /** when part of a carousel, shows a "1/5" badge */
  slideInfo?: { index: number; total: number };
  /** position offsets per element (fraction of width) */
  offsets?: PosterOffsets;
  /** enables drag-to-move of the logo, headline and CTA */
  editable?: boolean;
  onOffsetsChange?: (offsets: PosterOffsets) => void;
  /** optional photo to use as poster background (base64 data URL or remote URL) */
  backgroundImage?: string;
}

/**
 * Renders a branded poster using the brand palette, logo and AI copy.
 * Sizing is proportional to `width` so the same design exports at full
 * resolution via html-to-image's pixelRatio.
 */
export const PosterPreview = forwardRef<HTMLDivElement, PosterPreviewProps>(
  function PosterPreview(
    {
      brand,
      post,
      format,
      width,
      slideInfo,
      offsets = EMPTY_OFFSETS,
      editable = false,
      onOffsetsChange,
      backgroundImage,
    },
    ref,
  ) {
    const height = (width * format.height) / format.width;
    const u = width / 100; // 1 unit = 1% of width
    const { palette } = brand;
    const onPrimary = contrastColor(palette.primary);
    const dragRef = useRef<{
      key: PosterElement;
      startX: number;
      startY: number;
      baseX: number;
      baseY: number;
    } | null>(null);

    const handleProps = (key: PosterElement) => {
      const off = offsets[key];
      const base: React.CSSProperties = {
        transform: `translate(${off.x * width}px, ${off.y * width}px)`,
      };
      if (!editable || !onOffsetsChange) return { style: base };
      return {
        style: {
          ...base,
          cursor: "grab",
          touchAction: "none" as const,
          outline: `1px dashed ${palette.primary}aa`,
          outlineOffset: u * 1.5,
          borderRadius: u * 1.5,
        },
        onPointerDown: (e: React.PointerEvent) => {
          e.preventDefault();
          dragRef.current = {
            key,
            startX: e.clientX,
            startY: e.clientY,
            baseX: off.x,
            baseY: off.y,
          };
          const move = (ev: PointerEvent) => {
            const d = dragRef.current;
            if (!d) return;
            const nx = d.baseX + (ev.clientX - d.startX) / width;
            const ny = d.baseY + (ev.clientY - d.startY) / width;
            onOffsetsChange({
              ...offsets,
              [d.key]: {
                x: clamp(nx, -0.7, 0.7),
                y: clamp(ny, -1, 1),
              },
            });
          };
          const up = () => {
            dragRef.current = null;
            window.removeEventListener("pointermove", move);
            window.removeEventListener("pointerup", up);
          };
          window.addEventListener("pointermove", move);
          window.addEventListener("pointerup", up);
        },
      };
    };

    const renderHeadline = () => {
      const headline = post.headline;
      const highlight = post.highlight?.trim();
      if (!highlight || !headline.toLowerCase().includes(highlight.toLowerCase())) {
        return <span>{headline}</span>;
      }
      const idx = headline.toLowerCase().indexOf(highlight.toLowerCase());
      const before = headline.slice(0, idx);
      const match = headline.slice(idx, idx + highlight.length);
      const after = headline.slice(idx + highlight.length);
      return (
        <>
          {before}
          <span style={{ color: palette.accent }}>{match}</span>
          {after}
        </>
      );
    };

    return (
      <div
        ref={ref}
        style={{
          width,
          height,
          background: backgroundImage
            ? "#000"
            : `linear-gradient(155deg, ${palette.background} 0%, ${palette.primary}33 60%, ${palette.secondary}55 100%)`,
          color: palette.text,
          fontFamily: fontStack(brand.fontBody),
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: `${u * 7}px`,
          boxSizing: "border-box",
        }}
      >
        {/* user-uploaded background photo */}
        {backgroundImage && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={backgroundImage}
              alt=""
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center",
                zIndex: 0,
              }}
            />
            {/* dark overlay for readability */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(160deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.45) 100%)",
                zIndex: 1,
              }}
            />
          </>
        )}
        {/* decorative glow — hidden when using a photo background */}
        {!backgroundImage && (
          <>
            <div
              style={{
                position: "absolute",
                width: u * 70,
                height: u * 70,
                borderRadius: "50%",
                right: -u * 20,
                top: -u * 15,
                background: `radial-gradient(circle, ${palette.primary}aa, transparent 70%)`,
                filter: "blur(2px)",
              }}
            />
            <div
              style={{
                position: "absolute",
                width: u * 55,
                height: u * 55,
                borderRadius: "50%",
                left: -u * 18,
                bottom: u * 10,
                background: `radial-gradient(circle, ${palette.secondary}88, transparent 70%)`,
              }}
            />
          </>
        )}

        {/* header: logo / brand name — above overlay */}
        <div
          {...(() => {
            const hp = handleProps("logo");
            return {
              ...hp,
              style: {
                position: "relative" as const,
                zIndex: 2,
                display: "flex",
                alignItems: "center",
                gap: u * 2.5,
                ...hp.style,
              },
            };
          })()}
        >
          {brand.logoDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={brand.logoDataUrl}
              alt={brand.brandName}
              style={{
                height: u * 11,
                width: u * 11,
                objectFit: "contain",
                borderRadius: u * 2.5,
                background: "#ffffff10",
                padding: u * 1.2,
              }}
            />
          ) : (
            <div
              style={{
                height: u * 11,
                width: u * 11,
                borderRadius: u * 2.5,
                background: palette.primary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: u * 6,
                color: onPrimary,
              }}
            >
              {(brand.brandName || "M").charAt(0).toUpperCase()}
            </div>
          )}
          <span
            style={{
              fontWeight: 700,
              fontSize: u * 4.2,
              letterSpacing: 0.5,
            }}
          >
            {brand.brandName || "Sua Marca"}
          </span>
          {slideInfo && (
            <span
              style={{
                marginLeft: "auto",
                fontWeight: 700,
                fontSize: u * 3.4,
                padding: `${u * 1.2}px ${u * 3}px`,
                borderRadius: u * 10,
                background: `${palette.primary}33`,
                color: palette.text,
              }}
            >
              {slideInfo.index}/{slideInfo.total}
            </span>
          )}
        </div>

        {/* main content */}
        <div
          {...(() => {
            const hp = handleProps("headline");
            return {
              ...hp,
              style: { position: "relative" as const, zIndex: 2, ...hp.style },
            };
          })()}
        >
          <h1
            style={{
              fontFamily: fontStack(brand.fontHeading),
              fontWeight: 800,
              fontSize: u * 11,
              lineHeight: 1.05,
              margin: 0,
              marginBottom: u * 4,
              textShadow: "0 2px 20px rgba(0,0,0,0.35)",
            }}
          >
            {renderHeadline()}
          </h1>
          <p
            style={{
              fontSize: u * 4.2,
              lineHeight: 1.4,
              margin: 0,
              maxWidth: "85%",
              color: palette.text,
              opacity: 0.92,
            }}
          >
            {post.body}
          </p>
        </div>

        {/* footer: CTA */}
        <div
          {...(() => {
            const hp = handleProps("cta");
            return {
              ...hp,
              style: {
                position: "relative" as const,
                zIndex: 2,
                display: "flex",
                alignItems: "center",
                gap: u * 3,
                visibility: post.cta ? "visible" : "hidden",
                ...hp.style,
              },
            };
          })()}
        >
          <span
            style={{
              display: "inline-block",
              background: palette.primary,
              color: onPrimary,
              fontWeight: 700,
              fontSize: u * 4,
              padding: `${u * 3}px ${u * 5}px`,
              borderRadius: u * 10,
              boxShadow: `0 ${u * 1.5}px ${u * 4}px ${palette.primary}66`,
            }}
          >
            {post.cta}
          </span>
        </div>
      </div>
    );
  },
);
