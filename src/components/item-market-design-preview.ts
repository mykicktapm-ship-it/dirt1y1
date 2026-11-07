import type { PumpBondingCurve } from "@/dc-chain/pump-curve";
import type { MarketplaceItemId } from "@/resources/launch";

/**
 * Visual fixtures only, shown with a `Preview` marker while an item is not launched. Never pass
 * these values to wallet, RPC or trade calls. Every number here is a placeholder, not a fact.
 */
export interface ItemMarketDesignPreview {
  /** Monthly close in USDC, oldest first; the last 12 are "1Y", all 24 are "All". */
  history: readonly number[];
  /** Weekly trading volume, thousands of USDC, Mon–Fri. */
  weeklyVolume: readonly number[];
  /** Six months of buy and sell volume (thousands of USDC); row 0 is the latest season. */
  flow: { buys: readonly (readonly number[])[]; sells: readonly (readonly number[])[] };
  /** Placeholder curve so the trade estimator runs the real curve math on fake reserves. */
  curve: Pick<
    PumpBondingCurve,
    "virtualTokenReserves" | "virtualQuoteReserves" | "realTokenReserves" | "realQuoteReserves"
  >;
  /** Reputation season placeholders: share done and target. */
  season: { trades: [number, number]; volume: [number, number] };
}

/** Placeholder SOL per USDC for the quote toggle in preview. */
export const PREVIEW_SOL_PER_USDC = 0.0061;
export const PREVIEW_FLOW_MONTHS = ["May", "Jun", "Jul", "Aug", "Sep", "Oct"] as const;
export const PREVIEW_WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;

const year: Record<MarketplaceItemId, readonly number[]> = {
  glock18: [
    0.0148, 0.0153, 0.0151, 0.0162, 0.016, 0.0168, 0.0174, 0.0171, 0.0178, 0.0181, 0.0179, 0.0184,
  ],
  "weapon-case": [
    0.0291, 0.0287, 0.0294, 0.0288, 0.0282, 0.0286, 0.0279, 0.0283, 0.0275, 0.028, 0.0272, 0.0276,
  ],
  briefcase: [
    0.0098, 0.0102, 0.0106, 0.0104, 0.0109, 0.0107, 0.0112, 0.0115, 0.0111, 0.0114, 0.0113, 0.0117,
  ],
  "bulletproof-umbrella": [
    0.0321, 0.0338, 0.0329, 0.0356, 0.0348, 0.0372, 0.0364, 0.0391, 0.0382, 0.0406, 0.0398, 0.0428,
  ],
  "to-the-moon-visa": [
    0.0678, 0.0662, 0.0671, 0.0655, 0.0664, 0.0642, 0.0651, 0.0638, 0.0646, 0.0629, 0.0637, 0.0631,
  ],
  bitcoin: [
    0.0294, 0.0306, 0.0301, 0.0318, 0.0325, 0.0319, 0.0334, 0.0328, 0.0341, 0.0337, 0.0346, 0.0352,
  ],
  ethereum: [
    0.0271, 0.0266, 0.0274, 0.0261, 0.0268, 0.0257, 0.0262, 0.0253, 0.0258, 0.0247, 0.0254, 0.0249,
  ],
};

const week: Record<MarketplaceItemId, readonly number[]> = {
  glock18: [1.8, 2.4, 1.5, 3.1, 2.7],
  "weapon-case": [2.2, 1.9, 3.2, 2.7, 1.8],
  briefcase: [1.1, 1.5, 1.3, 2.2, 1.8],
  "bulletproof-umbrella": [2.1, 1.2, 3.4, 1.9, 4.6],
  "to-the-moon-visa": [4.1, 3.8, 2.9, 3.3, 3.0],
  bitcoin: [2.4, 3.2, 2.7, 3.8, 4.2],
  ethereum: [2.5, 2.0, 1.8, 2.3, 1.7],
};

const progress: Record<MarketplaceItemId, number> = {
  glock18: 0.38,
  "weapon-case": 0.52,
  briefcase: 0.24,
  "bulletproof-umbrella": 0.69,
  "to-the-moon-visa": 0.81,
  bitcoin: 0.57,
  ethereum: 0.46,
};

const INITIAL_REAL_TOKENS = 793_100_000_000_000n;
const VIRTUAL_TOKENS_START = 1_073_000_000_000_000n;

function build(id: MarketplaceItemId): ItemMarketDesignPreview {
  const recent = year[id];
  // A second, earlier year mirrored from the first with a small drift, so "All" has 24 points.
  const earlier = recent.map((value, index) => value * (0.78 + index * 0.012));
  const sold = BigInt(Math.round(progress[id] * 10_000));
  const realTokenReserves = INITIAL_REAL_TOKENS - (INITIAL_REAL_TOKENS * sold) / 10_000n;
  const virtualTokenReserves = VIRTUAL_TOKENS_START - (INITIAL_REAL_TOKENS - realTokenReserves);
  const price = recent[recent.length - 1];
  // virtual_quote / virtual_token = price (both 6 decimals).
  const virtualQuoteReserves = BigInt(Math.round(price * Number(virtualTokenReserves)));
  const scale = week[id].reduce((sum, value) => sum + value, 0) / 13;
  const wave = [2.4, 3.6, 5.4, 6.4, 5.0, 3.4];
  return {
    history: [...earlier, ...recent],
    weeklyVolume: week[id],
    flow: {
      buys: [1, 0.82, 0.64].map((k) => wave.map((v) => +(v * k * scale).toFixed(2))),
      sells: [0.62, 0.5, 0.4].map((k) =>
        wave.map((v, i) => +((v - i * 0.2) * k * scale).toFixed(2)),
      ),
    },
    curve: {
      virtualTokenReserves,
      virtualQuoteReserves,
      realTokenReserves,
      realQuoteReserves: (virtualQuoteReserves * 2n) / 5n,
    },
    season: { trades: [0.42, 60], volume: [0.76, 6_000] },
  };
}

export const ITEM_MARKET_DESIGN_PREVIEWS = Object.fromEntries(
  (Object.keys(year) as MarketplaceItemId[]).map((id) => [id, build(id)]),
) as Readonly<Record<MarketplaceItemId, ItemMarketDesignPreview>>;
