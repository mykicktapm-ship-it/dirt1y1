"use client";

import { useEffect, useState } from "react";

import {
  type DCMarketSnapshot,
  DC_MARKET_REFRESH_MS,
  DC_MARKET_SNAPSHOT_PATH,
  isDCMarketSnapshotFresh,
  parseDCMarketSnapshot,
} from "@/dc-chain";

type MarketState = Readonly<{
  snapshot: DCMarketSnapshot | null;
  status: "loading" | "ready" | "delayed" | "unavailable";
}>;

export function useMarketSnapshot(): MarketState {
  const [state, setState] = useState<MarketState>({ snapshot: null, status: "loading" });

  useEffect(() => {
    let active = true;
    let activeRequest: AbortController | null = null;

    async function refresh() {
      if (document.visibilityState !== "visible") return;

      activeRequest?.abort();
      const controller = new AbortController();
      let timedOut = false;
      const timeout = window.setTimeout(() => {
        timedOut = true;
        controller.abort(new Error("Market snapshot request timed out"));
      }, 8_000);
      activeRequest = controller;

      try {
        const response = await fetch(DC_MARKET_SNAPSHOT_PATH, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Market snapshot HTTP ${response.status}`);
        const snapshot = parseDCMarketSnapshot(await response.json());
        if (active && !controller.signal.aborted) {
          setState({
            snapshot,
            status: isDCMarketSnapshotFresh(snapshot) ? "ready" : "delayed",
          });
        }
      } catch {
        if (!active || (controller.signal.aborted && !timedOut)) return;
        setState((current) => ({
          snapshot: current.snapshot,
          status:
            current.snapshot && isDCMarketSnapshotFresh(current.snapshot)
              ? "ready"
              : current.snapshot
                ? "delayed"
                : "unavailable",
        }));
      } finally {
        window.clearTimeout(timeout);
        if (activeRequest === controller) activeRequest = null;
      }
    }

    void refresh();
    const interval = window.setInterval(() => void refresh(), DC_MARKET_REFRESH_MS);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      active = false;
      activeRequest?.abort();
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);

  return state;
}
