import {
  ITEM_MARKET_DESIGN_PREVIEWS,
  type ItemMarketDesignPreview,
  PREVIEW_SOL_PER_USDC,
} from "@/components/item-market-design-preview";
import { type DCItemMarketLoad, getPumpSwapPriceReserves } from "@/dc-chain/item-market-view";
import {
  PUMP_INITIAL_REAL_TOKEN_RESERVES,
  PUMP_INITIAL_VIRTUAL_TOKEN_RESERVES,
  type PumpBondingCurve,
  getPumpCurveLaunchQuoteReserves,
  getPumpCurveMarketCap,
  getPumpCurveProgressBps,
  quotePumpCurveSell,
} from "@/dc-chain/pump-curve";
import type { MarketplaceItemId } from "@/resources/launch";

/** Pump.fun coins, including USDC (the project coin), use 6 decimals. */
const UNIT = 1_000_000;

export type CurveReserves = Pick<
  PumpBondingCurve,
  "virtualTokenReserves" | "virtualQuoteReserves" | "realTokenReserves" | "realQuoteReserves"
>;

/**
 * What the bento can show for one item. `live` comes from the on-chain curve; `preview` from
 * labelled fixtures while the item is not launched; `none` when nothing may be shown.
 * Numbers here are presentation values only — chain math stays in `bigint` in DC Chain.
 */
export interface ItemFigures {
  mode: "live" | "preview" | "none";
  price: number | null;
  /** Price at launch: the curve's start (live) or the first preview close. */
  launchPrice: number | null;
  marketCap: number | null;
  /** Monthly closes (24, oldest first); only preview has history today. */
  history: readonly number[] | null;
  preview: ItemMarketDesignPreview | null;
  curve: CurveReserves | null;
  /** Sold share of the curve allocation, 0–1. */
  progress: number | null;
  /** Tokens in whole units: sold, still on the curve, reserved for PumpSwap. */
  supply: { sold: number; curve: number; reserved: number } | null;
  quoteReserve: number | null;
  creatorFeeBps: bigint | null;
  mint: string | null;
}

const TOTAL_SUPPLY = 1_000_000_000;
const CURVE_ALLOCATION = Number(PUMP_INITIAL_REAL_TOKEN_RESERVES) / UNIT;

function launchPriceOf(
  curve: Pick<PumpBondingCurve, "virtualQuoteReserves" | "virtualTokenReserves">,
) {
  const price =
    Number(getPumpCurveLaunchQuoteReserves(curve)) / Number(PUMP_INITIAL_VIRTUAL_TOKEN_RESERVES);
  return price > 0 && Number.isFinite(price) ? price : null;
}

function supplyFrom(realTokenReserves: bigint) {
  const onCurve = Number(realTokenReserves) / UNIT;
  return {
    sold: CURVE_ALLOCATION - onCurve,
    curve: onCurve,
    reserved: TOTAL_SUPPLY - CURVE_ALLOCATION,
  };
}

export function itemFigures(itemId: MarketplaceItemId, load: DCItemMarketLoad): ItemFigures {
  const empty: ItemFigures = {
    mode: "none",
    price: null,
    launchPrice: null,
    marketCap: null,
    history: null,
    preview: null,
    curve: null,
    progress: null,
    supply: null,
    quoteReserve: null,
    creatorFeeBps: null,
    mint: null,
  };
  if (load.state !== "ready") return empty;
  const market = load.market;

  if (market.status === "not-launched") {
    const preview = ITEM_MARKET_DESIGN_PREVIEWS[itemId];
    const price = preview.history[preview.history.length - 1];
    return {
      ...empty,
      mode: "preview",
      price,
      launchPrice: preview.history[0],
      marketCap: price * TOTAL_SUPPLY,
      history: preview.history,
      preview,
      curve: preview.curve,
      progress: Number(getPumpCurveProgressBps({ ...preview.curve, complete: false })) / 10_000,
      supply: supplyFrom(preview.curve.realTokenReserves),
      quoteReserve: Number(preview.curve.realQuoteReserves) / UNIT,
    };
  }

  if (market.status === "graduated") {
    // Without a readable pool: no stale curve price, only the link.
    const pool = market.pool && getPumpSwapPriceReserves(market.pool);
    const launchPrice = launchPriceOf(market.curve);
    if (!pool) return { ...empty, mode: "live", launchPrice, progress: 1, mint: market.mint };
    return {
      ...empty,
      mode: "live",
      price: Number(pool.virtualQuoteReserves) / Number(pool.virtualTokenReserves),
      launchPrice,
      marketCap:
        Number(
          getPumpCurveMarketCap({ ...pool, tokenTotalSupply: market.curve.tokenTotalSupply }),
        ) / UNIT,
      curve: pool,
      progress: 1,
      supply: { sold: CURVE_ALLOCATION, curve: 0, reserved: TOTAL_SUPPLY - CURVE_ALLOCATION },
      quoteReserve: Number(pool.realQuoteReserves) / UNIT,
      creatorFeeBps: market.curve.creatorFeeBps,
      mint: market.mint,
    };
  }

  if (market.status === "curve") {
    const { curve } = market;
    return {
      ...empty,
      mode: "live",
      price: Number(curve.virtualQuoteReserves) / Number(curve.virtualTokenReserves),
      launchPrice: launchPriceOf(curve),
      marketCap: Number(getPumpCurveMarketCap(curve)) / UNIT,
      curve,
      progress: Number(getPumpCurveProgressBps(curve)) / 10_000,
      supply: supplyFrom(curve.realTokenReserves),
      quoteReserve: Number(curve.realQuoteReserves) / UNIT,
      creatorFeeBps: curve.creatorFeeBps,
      mint: market.mint,
    };
  }

  return empty;
}

/** Change since launch: percent and USDC amount; `null` without a price or launch price. */
export function sinceLaunch(figures: ItemFigures): { change: number; amount: number } | null {
  if (figures.price === null || !figures.launchPrice) return null;
  return {
    change: (figures.price / figures.launchPrice - 1) * 100,
    amount: figures.price - figures.launchPrice,
  };
}

/** Visible label for the change period (owner copy). */
export const SINCE_LAUNCH = "since launch";

/** USDC a sale of `amount` item base units returns now, before fees; `null` without reserves. */
export function holdingValue(figures: ItemFigures, amount: bigint): number | null {
  if (!figures.curve || amount <= 0n) return null;
  return Number(quotePumpCurveSell(figures.curve, amount)) / UNIT;
}

/* --------------------------------- quotes ---------------------------------- */

export type Quote = "USDC" | "SOL";

/** SOL conversion exists only for preview until the USDC/SOL pool is read. */
export function toQuote(usdc: number, quote: Quote): number {
  return quote === "SOL" ? usdc * PREVIEW_SOL_PER_USDC : usdc;
}

/* ------------------------------- formatting -------------------------------- */

/** Four significant digits, never scientific notation. */
export function formatPrice(value: number): string {
  if (!Number.isFinite(value) || value === 0) return "0";
  const digits = Math.max(0, 3 - Math.floor(Math.log10(Math.abs(value))));
  return value.toLocaleString("en-US", {
    minimumFractionDigits: Math.min(digits, 12),
    maximumFractionDigits: Math.min(digits, 12),
  });
}

export function formatAmount(value: number, fractionDigits = 2): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

export function formatCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e9) return `${(value / 1e9).toFixed(abs >= 1e10 ? 0 : 1)}B`;
  if (abs >= 1e6) return `${(value / 1e6).toFixed(abs >= 1e7 ? 0 : 1)}M`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(abs >= 1e4 ? 0 : 1)}K`;
  return formatPrice(value);
}

/** One decimal, as on the catalogue cards: "+12.4%". */
export function formatChange(value: number): string {
  return `${value >= 0 ? "+" : "−"}${Math.abs(value).toFixed(1)}%`;
}

export function formatSignedPercent(value: number): string {
  return `${value >= 0 ? "+" : "−"}${Math.abs(value).toFixed(2)}%`;
}

/** Weekly points for 1M/3M from monthly closes, like the bento's interpolated series. */
export type Period = "1M" | "3M" | "1Y" | "All";
export const PERIODS: readonly Period[] = ["1M", "3M", "1Y", "All"];

export interface SeriesPoint {
  label: string;
  price: number;
  /** 0–1 position along the full history, for the sold share at that time. */
  at: number;
}

export function priceSeries(
  history: readonly number[],
  period: Period,
  now = new Date(),
): SeriesPoint[] {
  const n = history.length;
  const month = (offset: number, withYear: boolean) =>
    new Date(now.getFullYear(), now.getMonth() - offset, 1).toLocaleDateString("en-US", {
      month: "short",
      ...(withYear ? { year: "2-digit" } : {}),
    });
  if (period === "All") {
    return history.map((price, index) => ({
      label: month(n - 1 - index, true),
      price,
      at: index / (n - 1),
    }));
  }
  if (period === "1Y") {
    return history.slice(-12).map((price, index) => ({
      label: month(11 - index, false),
      price,
      at: (n - 12 + index) / (n - 1),
    }));
  }
  const points = period === "3M" ? 13 : 5;
  const source = history.slice(period === "3M" ? -4 : -2);
  return Array.from({ length: points }, (_, k) => {
    const f = (k / (points - 1)) * (source.length - 1);
    const i = Math.min(source.length - 2, Math.floor(f));
    const t = f - i;
    const wobble = Math.sin(k * 1.7) * 0.012;
    const date = new Date(now.getTime() - (points - 1 - k) * 7 * 86_400_000);
    return {
      label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      price: (source[i] + (source[i + 1] - source[i]) * t) * (1 + wobble),
      at: (n - source.length + f) / (n - 1),
    };
  });
}

export const PERIOD_SUFFIX: Record<Period, string> = {
  "1M": "this month",
  "3M": "in 3 months",
  "1Y": "this year",
  All: "in 2 years",
};
