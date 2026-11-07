"use client";

import { useSyncExternalStore } from "react";

import type { DCItemMarketLoad } from "@/dc-chain/item-market-view";
import { type DCItemMarket, getDCItemMarkets } from "@/dc-chain/item-markets";
import { type MarketplaceItemId, itemMarketMints, marketplaceItemIds } from "@/resources/launch";

const REFRESH_MS = 30_000;

export type DCItemMarketsLoad =
  | { state: "loading" }
  | { state: "error" }
  | { state: "ready"; markets: DCItemMarket[] };

const nothingLaunched = Object.values(itemMarketMints).every((mint) => mint === null);

// Before any launch the answer is known without a request, so the server and the first client
// render show the same preview figures.
const initial: DCItemMarketsLoad = nothingLaunched
  ? {
      state: "ready",
      markets: marketplaceItemIds.map((itemId) => ({ itemId, status: "not-launched" })),
    }
  : { state: "loading" };

let current: DCItemMarketsLoad = initial;
const listeners = new Set<() => void>();
let controller: AbortController | null = null;
let timer = 0;

function publish(next: DCItemMarketsLoad) {
  current = next;
  for (const listener of listeners) listener();
}

/** One read for every subscriber on the page; refreshes while the tab is visible. */
async function read() {
  window.clearTimeout(timer);
  if (document.hidden) return;
  controller?.abort();
  const own = new AbortController();
  controller = own;
  try {
    const result = await getDCItemMarkets(own.signal);
    if (own.signal.aborted) return;
    publish({ state: "ready", markets: result.markets });
  } catch {
    if (own.signal.aborted) return;
    // Keep the last good figures; only a first failure is shown.
    if (current.state !== "ready") publish({ state: "error" });
  }
  timer = window.setTimeout(read, REFRESH_MS);
}

function onVisibility() {
  if (!document.hidden) void read();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1 && !nothingLaunched) {
    void read();
    document.addEventListener("visibilitychange", onVisibility);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size) return;
    controller?.abort();
    controller = null;
    window.clearTimeout(timer);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}

/** All item markets, shared by every component on the page. */
export function useItemMarkets(): DCItemMarketsLoad {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => initial,
  );
}

export function selectItemMarket(
  load: DCItemMarketsLoad,
  itemId: MarketplaceItemId,
): DCItemMarketLoad {
  if (load.state !== "ready") return load;
  const market = load.markets.find((entry) => entry.itemId === itemId);
  return market ? { state: "ready", market } : { state: "error" };
}

/** Reads the item's Pump.fun market; refreshes while the tab is visible. */
export function useItemMarket(itemId: MarketplaceItemId): DCItemMarketLoad {
  return selectItemMarket(useItemMarkets(), itemId);
}
