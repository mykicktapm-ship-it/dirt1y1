import { marketplaceItems } from "./marketplace";

export type MarketplaceItemId = (typeof marketplaceItems)[number]["id"];

/**
 * Launch addresses: the only values to fill in at launch. Every price, market cap, curve and
 * holding on the site reads from here; nothing else changes when a coin launches.
 *
 * USDC (the project coin): Pump.fun mint of the launched coin. The current value is the
 * reference coin; replace it with the mint printed by Pump.fun. The public market snapshot
 * (`NEXT_PUBLIC_MARKET_SNAPSHOT_URL`) must be generated for the same mint.
 */
export const usdcMint = "3AhBGRpVWuQudccqfmjeUcifgicN6MyNK3YPy3qwpump";

/**
 * Pump.fun mint of each item coin, quoted in USDC. `null` until that item launches: the item
 * then shows its labelled preview. Paste the exact mint printed by Pump.fun after launch.
 */
export const itemMarketMints: Readonly<Record<MarketplaceItemId, string | null>> = {
  glock18: null,
  "weapon-case": null,
  briefcase: null,
  "bulletproof-umbrella": null,
  "to-the-moon-visa": null,
  bitcoin: null,
  ethereum: null,
};

/** Public Pump.fun page where the item coin is traded. */
export function getPumpCoinUrl(mint: string): string {
  return `https://pump.fun/coin/${encodeURIComponent(mint)}`;
}

export const marketplaceItemIds = marketplaceItems.map((item) => item.id) as MarketplaceItemId[];
