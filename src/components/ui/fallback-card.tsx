"use client";

import { cn } from "@/lib/utils";
import { Code2, Eye } from "lucide-react";
import React, { useRef, useEffect, useLayoutEffect, useState } from "react";
import { SkeletonImage } from "./skeleton-image";
import { RoundedSkeleton } from "./skeleton-shapes";

interface FallbackCardProps {
  avatarSrc?: string;
  className?: string;
  framed?: boolean;
  showFooter?: boolean;
  title?: string;
  videoSrc?: string;
  showGlitch?: boolean;
}

function intersectsViewport(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.bottom > 0 &&
    rect.right > 0 &&
    rect.top < window.innerHeight &&
    rect.left < window.innerWidth
  );
}

/* ──────────────── LetterGlitch (inline) ──────────────── */
export function LetterGlitch({
  glitchSpeed = 50,
  centerVignette = false,
  outerVignette = true,
  smooth = true,
  characters = ".,:;-*#",
  className = "",
}: {
  glitchSpeed?: number;
  centerVignette?: boolean;
  outerVignette?: boolean;
  smooth?: boolean;
  characters?: string;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const letters = useRef<
    Array<{ char: string; color: string; targetColor: string; colorProgress: number }>
  >([]);
  const grid = useRef({ columns: 0, rows: 0 });
  const canvasSize = useRef({ width: 0, height: 0 });
  const context = useRef<CanvasRenderingContext2D | null>(null);
  const lastGlitchTime = useRef(Date.now());

  const glitchColors = ["#78b4ff", "#a0c4ff", "#c7d2fe", "#e0e7ff", "#f0f4ff"];
  const lettersAndSymbols = Array.from(characters);
  const fontSize = 16;
  const charWidth = 10;
  const charHeight = 20;

  const getRandomChar = () =>
    lettersAndSymbols[Math.floor(Math.random() * lettersAndSymbols.length)];
  const getRandomColor = () => glitchColors[Math.floor(Math.random() * glitchColors.length)];

  const hexToRgb = (hex: string) => {
    const shorthand = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    const normalizedHex = hex.replace(shorthand, (_, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(normalizedHex);
    return result
      ? {
          r: Number.parseInt(result[1], 16),
          g: Number.parseInt(result[2], 16),
          b: Number.parseInt(result[3], 16),
        }
      : null;
  };

  const interpolateColor = (
    s: { r: number; g: number; b: number },
    e: { r: number; g: number; b: number },
    f: number,
  ) =>
    `rgb(${Math.round(s.r + (e.r - s.r) * f)}, ${Math.round(s.g + (e.g - s.g) * f)}, ${Math.round(s.b + (e.b - s.b) * f)})`;

  const calculateGrid = (w: number, h: number) => ({
    columns: Math.ceil(w / charWidth),
    rows: Math.ceil(h / charHeight),
  });

  const initializeLetters = (columns: number, rows: number) => {
    grid.current = { columns, rows };
    letters.current = Array.from({ length: columns * rows }, () => ({
      char: getRandomChar(),
      color: getRandomColor(),
      targetColor: getRandomColor(),
      colorProgress: 1,
    }));
  };

  const drawLetters = () => {
    if (!context.current || !canvasRef.current) return;
    const ctx = context.current;
    const { width, height } = canvasSize.current;
    ctx.clearRect(0, 0, width, height);
    ctx.font = `${fontSize}px monospace`;
    ctx.textBaseline = "top";
    letters.current.forEach((letter, i) => {
      const x = (i % grid.current.columns) * charWidth;
      const y = Math.floor(i / grid.current.columns) * charHeight;
      ctx.fillStyle = letter.color;
      ctx.fillText(letter.char, x, y);
    });
  };

  const updateLetters = () => {
    const updateCount = Math.max(1, Math.floor(letters.current.length * 0.05));
    for (let i = 0; i < updateCount; i++) {
      const idx = Math.floor(Math.random() * letters.current.length);
      if (!letters.current[idx]) continue;
      letters.current[idx].char = getRandomChar();
      letters.current[idx].targetColor = getRandomColor();
      if (!smooth) {
        letters.current[idx].color = letters.current[idx].targetColor;
        letters.current[idx].colorProgress = 1;
      } else {
        letters.current[idx].colorProgress = 0;
      }
    }
  };

  const handleSmooth = () => {
    let redraw = false;
    for (const l of letters.current) {
      if (l.colorProgress < 1) {
        l.colorProgress += 0.05;
        if (l.colorProgress > 1) l.colorProgress = 1;
        const s = hexToRgb(l.color);
        const e = hexToRgb(l.targetColor);
        if (s && e) {
          l.color = interpolateColor(s, e, l.colorProgress);
          redraw = true;
        }
      }
    }
    if (redraw) drawLetters();
  };

  const animate = () => {
    const now = Date.now();
    if (now - lastGlitchTime.current >= glitchSpeed) {
      updateLetters();
      drawLetters();
      lastGlitchTime.current = now;
    }
    if (smooth) handleSmooth();
    animationRef.current = requestAnimationFrame(animate);
  };

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = parent.getBoundingClientRect();
    canvasSize.current = { width: rect.width, height: rect.height };
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    if (context.current) context.current.setTransform(dpr, 0, 0, dpr, 0, 0);
    const { columns, rows } = calculateGrid(rect.width, rect.height);
    initializeLetters(columns, rows);
    drawLetters();
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: canvas callbacks share this effect's lifecycle and are rebuilt when animation inputs change.
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    context.current = canvas.getContext("2d");
    resizeCanvas();
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = intersectsViewport(canvas);
    const stopAnimation = () => {
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    };
    const syncAnimation = () => {
      stopAnimation();
      if (!visible || document.hidden || motionQuery.matches) return;
      lastGlitchTime.current = Date.now();
      animationRef.current = requestAnimationFrame(animate);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncAnimation();
    });
    observer.observe(canvas);
    syncAnimation();
    let resizeTimeout: ReturnType<typeof setTimeout> | undefined;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        resizeCanvas();
        visible = intersectsViewport(canvas);
        syncAnimation();
      }, 100);
    };
    window.addEventListener("resize", handleResize);
    document.addEventListener("visibilitychange", syncAnimation);
    motionQuery.addEventListener("change", syncAnimation);
    return () => {
      stopAnimation();
      clearTimeout(resizeTimeout);
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", syncAnimation);
      motionQuery.removeEventListener("change", syncAnimation);
    };
  }, [characters, glitchSpeed, smooth]);

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <canvas ref={canvasRef} className="block w-full h-full" />
      {outerVignette && (
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,rgba(0,0,0,0)_60%,rgba(0,0,0,1)_100%)]" />
      )}
      {centerVignette && (
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,rgba(0,0,0,0.8)_0%,rgba(0,0,0,0)_60%)]" />
      )}
    </div>
  );
}

function MotionAwareVideo({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [requestedSource, setRequestedSource] = useState<string | null>(null);
  const [settledSource, setSettledSource] = useState<string | null>(null);
  const pending = settledSource !== src;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setRequestedSource(src);
        observer.disconnect();
      },
      { rootMargin: "100px" },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (requestedSource === src && video.readyState >= 2) setSettledSource(src);
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = intersectsViewport(video);
    const syncPlayback = () => {
      if (requestedSource !== src || !visible || document.hidden || motionQuery.matches)
        video.pause();
      else void video.play().catch(() => undefined);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncPlayback();
    });
    observer.observe(video);
    syncPlayback();
    document.addEventListener("visibilitychange", syncPlayback);
    motionQuery.addEventListener("change", syncPlayback);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", syncPlayback);
      motionQuery.removeEventListener("change", syncPlayback);
      video.pause();
    };
  }, [requestedSource, src]);

  return (
    <>
      <video
        className="absolute inset-0 z-[1] w-full h-full object-cover"
        loop
        muted
        playsInline
        preload="metadata"
        ref={videoRef}
        src={requestedSource === src ? src : undefined}
        data-site-loading={pending ? "true" : undefined}
        style={{ opacity: pending ? 0 : 1 }}
        onLoadedMetadata={(event) => {
          const video = event.currentTarget;
          if (
            video.readyState < 2 &&
            video.duration > 0 &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ) {
            // Decode a still frame without starting reduced-motion playback.
            video.currentTime = Math.min(0.001, video.duration / 2);
          }
        }}
        onLoadedData={() => setSettledSource(src)}
        onError={() => setSettledSource(src)}
      />
      {pending && (
        <RoundedSkeleton className="pointer-events-none absolute inset-0 z-[1] h-full w-full" />
      )}
    </>
  );
}

/* ──────────────── FallbackCard ──────────────── */
export default function FallbackCard({
  avatarSrc,
  className,
  framed = true,
  showFooter = true,
  title,
  videoSrc,
  showGlitch = true,
}: FallbackCardProps) {
  return (
    <div
      className={cn(
        "relative flex w-full flex-col overflow-hidden",
        framed && "rounded-2xl border border-white/30 shadow-md",
        videoSrc ? "bg-transparent" : "bg-black",
        className,
      )}
    >
      <div
        className="relative flex w-full flex-col items-center justify-center overflow-hidden"
        style={{ aspectRatio: "16 / 9" }}
      >
        {/* Glitch layer */}
        {showGlitch && (
          <div className="absolute inset-0 opacity-25 z-10">
            <LetterGlitch characters="₀₁. " />
          </div>
        )}

        {/* Video background (optional, replaces blue glow) */}
        {videoSrc && <MotionAwareVideo key={videoSrc} src={videoSrc} />}

        {/* Radial glow / vignette overlay */}
        {!videoSrc && (
          <div
            className="absolute inset-0 z-0"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(120,180,255,0.25), transparent 70%), #000000",
            }}
          />
        )}
        {/* Light vignette on top of video to blend edges */}
        {videoSrc && (
          <div
            className="absolute inset-0 z-[5] pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(0,0,0,0.05), rgba(0,0,0,0.55) 100%)",
            }}
          />
        )}
        {/* Blur bar at bottom / bottom-sides on top of video */}
        {videoSrc && (
          <div
            className="absolute inset-x-0 bottom-0 pointer-events-none z-[6]"
            style={{
              height: "30%",
              background:
                "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 50%, transparent 100%)",
              backdropFilter: "blur(30px)",
              WebkitBackdropFilter: "blur(30px)",
              maskImage:
                "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0) 100%)",
              WebkitMaskImage:
                "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0) 100%)",
            }}
          />
        )}
      </div>

      {avatarSrc && (
        <div className="absolute bottom-[10px] left-[10px] z-20 flex items-center gap-0">
          <div
            className="h-[40px] w-[40px] flex-shrink-0 overflow-hidden rounded-full border-2 border-white/30 bg-black shadow-lg"
            style={{ marginRight: "8px" }}
          >
            <SkeletonImage
              alt="avatar"
              shape="circle"
              className="h-full w-full object-cover"
              src={avatarSrc}
            />
          </div>
          {title && (
            <p
              className="text-sm font-bold leading-snug text-white/90"
              style={{ maxWidth: "170px" }}
            >
              {title}
            </p>
          )}
        </div>
      )}
      {!avatarSrc && title && (
        <div className="absolute bottom-[10px] left-[10px] z-20">
          <p className="text-sm font-bold leading-snug text-white/90" style={{ maxWidth: "170px" }}>
            {title}
          </p>
        </div>
      )}

      {showFooter && (
        <div className="flex justify-end gap-2 p-3">
          <span
            aria-hidden="true"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/20 bg-transparent text-white/60 transition-colors hover:bg-white/10 hover:text-white/80"
          >
            <Eye className="h-4 w-4" />
          </span>
          <span
            aria-hidden="true"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white text-black transition-colors hover:bg-white/90"
          >
            <Code2 className="h-4 w-4" />
          </span>
        </div>
      )}
    </div>
  );
}
