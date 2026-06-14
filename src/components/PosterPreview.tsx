"use client";

import { forwardRef } from "react";
import type { BrandProfile, ContentFormat, GeneratedPost } from "@/lib/types";
import { contrastColor } from "@/lib/palettes";
import { fontStack } from "@/lib/fonts";

interface PosterPreviewProps {
  brand: BrandProfile;
  post: GeneratedPost;
  format: ContentFormat;
  /** rendered display width in px */
  width: number;
  /** when part of a carousel, shows a "1/5" badge */
  slideInfo?: { index: number; total: number };
}

/**
 * Renders a branded poster using the brand palette, logo and AI copy.
 * Sizing is proportional to `width` so the same design exports at full
 * resolution via html-to-image's pixelRatio.
 */
export const PosterPreview = forwardRef<HTMLDivElement, PosterPreviewProps>(
  function PosterPreview({ brand, post, format, width, slideInfo }, ref) {
    const height = (width * format.height) / format.width;
    const u = width / 100; // 1 unit = 1% of width
    const { palette } = brand;
    const onPrimary = contrastColor(palette.primary);

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
          background: `linear-gradient(155deg, ${palette.background} 0%, ${palette.primary}33 60%, ${palette.secondary}55 100%)`,
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
        {/* decorative glow */}
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

        {/* header: logo / brand name */}
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: u * 2.5,
          }}
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
        <div style={{ position: "relative" }}>
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
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: u * 3,
            visibility: post.cta ? "visible" : "hidden",
          }}
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
