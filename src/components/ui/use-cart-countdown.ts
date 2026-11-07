"use client";

import { useEffect, useState } from "react";

/** Early Adopters Event end: 2026-11-13T23:59:59Z. */
export const CART_COUNTDOWN_END = Date.UTC(2026, 10, 13, 23, 59, 59);

export interface CartCountdown {
  label: string;
  compact: string;
  expired: boolean;
}

function formatRemaining(remainingMs: number): CartCountdown {
  if (remainingMs <= 0) {
    return { label: "Ended", compact: "Ended", expired: true };
  }

  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => String(value).padStart(2, "0");

  return {
    label: days > 0 ? `${days}d ${pad(hours)}h` : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`,
    compact: days > 0 ? `${days}d` : `${pad(hours)}:${pad(minutes)}`,
    expired: false,
  };
}

/**
 * SSR-safe countdown. Returns null before the client mounts so the server and
 * first client render agree; updates once the effect runs.
 */
export function useCartCountdown(end: number = CART_COUNTDOWN_END): CartCountdown | null {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  return now === null ? null : formatRemaining(end - now);
}
