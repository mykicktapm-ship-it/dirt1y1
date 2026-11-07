"use client";

import { useEffect, useState } from "react";

import {
  type DCLeaderboardSnapshot,
  DC_LEADERBOARD_REFRESH_MS,
  DC_LEADERBOARD_SNAPSHOT_PATH,
  isDCLeaderboardSnapshotFresh,
  parseDCLeaderboardSnapshot,
} from "@/dc-chain";

type LeaderboardState = Readonly<{
  snapshot: DCLeaderboardSnapshot | null;
  status: "loading" | "ready" | "delayed" | "unavailable";
}>;

export function useLeaderboard(): LeaderboardState {
  const [state, setState] = useState<LeaderboardState>({
    snapshot: null,
    status: "loading",
  });

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
        controller.abort(new Error("Leaderboard request timed out"));
      }, 8_000);
      activeRequest = controller;

      try {
        const response = await fetch(DC_LEADERBOARD_SNAPSHOT_PATH, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Leaderboard HTTP ${response.status}`);
        const snapshot = parseDCLeaderboardSnapshot(await response.json());
        if (active && !controller.signal.aborted) {
          setState({
            snapshot,
            status: isDCLeaderboardSnapshotFresh(snapshot) ? "ready" : "delayed",
          });
        }
      } catch {
        if (!active || (controller.signal.aborted && !timedOut)) return;
        setState((current) => ({
          snapshot: current.snapshot,
          status:
            current.snapshot && isDCLeaderboardSnapshotFresh(current.snapshot)
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
    const interval = window.setInterval(() => void refresh(), DC_LEADERBOARD_REFRESH_MS);
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
