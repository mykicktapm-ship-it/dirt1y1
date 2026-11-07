"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

interface Drop {
  x: number;
  y: number;
  speed: number;
  char: string;
}

export default function MatrixBackground() {
  const home = usePathname() === "/";
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!home) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const chars =
      "$DC$DC$DC$DC$DC$DCABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
    const fontSize = 14;
    const dropCount = 60;
    // Paint each glyph's glow once; the animation only composites small sprites.
    const glyphs = new Map<string, HTMLCanvasElement>();
    for (const char of new Set(chars)) {
      const glyph = document.createElement("canvas");
      glyph.width = 40;
      glyph.height = 46;
      const paint = glyph.getContext("2d");
      if (!paint) continue;
      paint.font = `${fontSize}px monospace`;
      const glowing = "$DC".includes(char);
      paint.fillStyle = glowing ? "#00ff00" : "rgba(51, 65, 85, 0.4)";
      if (glowing) {
        paint.shadowColor = "rgba(255, 255, 255, 0.8)";
        paint.shadowBlur = 8;
      }
      paint.fillText(char, 16, 30);
      glyphs.set(char, glyph);
    }

    let drops: Drop[] = [];
    let animationId = 0;
    let slide = Number(document.documentElement.dataset.homeSlide ?? 0);
    const rainEnabled = () => slide === 1 || slide === 3;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = Math.ceil(window.innerHeight * 0.5);
    };
    resize();
    drops = Array.from({ length: dropCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      speed: 0.5 + Math.random() * 1.5,
      char: chars[Math.floor(Math.random() * chars.length)],
    }));

    const draw = (advance = true, step = 1) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!rainEnabled()) return;
      for (const drop of drops) {
        if (advance) drop.y += drop.speed * step;
        if (drop.y > canvas.height + fontSize) {
          drop.y = -fontSize;
          drop.x = Math.random() * canvas.width;
          drop.char = chars[Math.floor(Math.random() * chars.length)];
          drop.speed = 0.5 + Math.random() * 1.5;
        }
        const glyph = glyphs.get(drop.char);
        if (glyph) ctx.drawImage(glyph, drop.x - 16, drop.y - 30);
      }
    };

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let siteReady = Boolean(document.querySelector('[data-app-ready="true"]'));
    let previousPaint = performance.now();
    const tick = (now: number) => {
      animationId = requestAnimationFrame(tick);
      if (now - previousPaint < 1000 / 30) return;
      const step = Math.min(3, (now - previousPaint) * 0.06);
      previousPaint = now;
      draw(true, step);
    };
    const sync = () => {
      cancelAnimationFrame(animationId);
      animationId = 0;
      canvas.style.visibility = rainEnabled() ? "visible" : "hidden";
      draw(false);
      if (!rainEnabled() || !siteReady || document.hidden || motionQuery.matches) return;
      previousPaint = performance.now();
      animationId = requestAnimationFrame(tick);
    };
    const onSlideChange = (event: Event) => {
      const index = (event as CustomEvent<{ index: number }>).detail?.index;
      slide = Number.isInteger(index) ? index : 0;
      sync();
    };
    const onSiteReady = () => {
      siteReady = true;
      sync();
    };
    const onResize = () => {
      resize();
      sync();
    };
    sync();
    window.addEventListener("dc:home-slide-change", onSlideChange);
    window.addEventListener("dc:site-ready", onSiteReady);
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", sync);
    motionQuery.addEventListener("change", sync);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("dc:home-slide-change", onSlideChange);
      window.removeEventListener("dc:site-ready", onSiteReady);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", sync);
      motionQuery.removeEventListener("change", sync);
    };
  }, [home]);

  if (!home) return null;
  return (
    <canvas
      aria-hidden="true"
      tabIndex={-1}
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "50vh",
        visibility: "hidden",
        zIndex: 0,
        pointerEvents: "none",
        maskImage:
          "linear-gradient(to bottom, rgba(0,0,0,1) 40%, rgba(0,0,0,0.6) 70%, rgba(0,0,0,0) 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, rgba(0,0,0,1) 40%, rgba(0,0,0,0.6) 70%, rgba(0,0,0,0) 100%)",
      }}
    />
  );
}
