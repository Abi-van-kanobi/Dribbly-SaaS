"use client";

import { useState } from "react";
import { Play, Sparkle, X } from "@phosphor-icons/react";

/**
 * No real product-demo video exists yet. This renders the full player
 * treatment (poster, gradient play button, lazy-mount-on-click) against a
 * `videoUrl` prop so dropping in a real embed later is a one-line change —
 * until then, clicking play surfaces an honest placeholder instead of a
 * broken or fake player.
 */
export function VideoSection({ videoUrl }: { videoUrl?: string }) {
  const [playing, setPlaying] = useState(false);

  if (playing && videoUrl) {
    return (
      <div className="relative w-full rounded-[24px] overflow-hidden" style={{ aspectRatio: "16/9", boxShadow: "var(--aurora-shadow-lg)" }}>
        <iframe src={videoUrl} className="absolute inset-0 w-full h-full" allow="autoplay; fullscreen" loading="lazy" title="Ettuno product walkthrough" />
      </div>
    );
  }

  return (
    <div
      className="relative w-full rounded-[24px] overflow-hidden"
      style={{ aspectRatio: "16/9", background: "var(--aurora-gradient-soft)", boxShadow: "var(--aurora-shadow-lg)" }}
    >
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(124,58,237,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,.15) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <span className="w-11 h-11 rounded-xl grid place-items-center" style={{ background: "var(--aurora-gradient-primary)" }}>
          <Sparkle weight="fill" size={22} color="#fff" />
        </span>
        <span className="text-[13px] font-medium" style={{ color: "var(--aurora-text-muted)" }}>
          Product walkthrough
        </span>
      </div>

      <button
        type="button"
        onClick={() => setPlaying(true)}
        aria-label="Play product walkthrough video"
        className="absolute inset-0 flex items-center justify-center cursor-pointer"
      >
        <span
          className="w-20 h-20 rounded-full grid place-items-center transition-transform hover:scale-105"
          style={{ background: "var(--aurora-gradient-primary)", boxShadow: "0 16px 40px rgba(124,58,237,.45)" }}
        >
          <Play weight="fill" size={28} color="#fff" style={{ marginLeft: 4 }} />
        </span>
      </button>

      {playing && !videoUrl && (
        <div
          className="absolute inset-0 flex items-center justify-center p-6"
          style={{ background: "rgba(20,18,31,.6)" }}
          onClick={() => setPlaying(false)}
        >
          <div className="mkt-card px-7 py-6 max-w-[340px] text-center relative" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPlaying(false)}
              aria-label="Close"
              className="absolute top-3 right-3"
              style={{ color: "var(--aurora-text-muted)" }}
            >
              <X size={16} />
            </button>
            <p className="text-[14.5px] m-0" style={{ color: "var(--aurora-text)" }}>
              Product walkthrough video goes here — drop in a video file or embed URL to replace this placeholder.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
