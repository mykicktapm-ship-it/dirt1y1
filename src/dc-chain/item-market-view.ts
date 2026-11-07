import type { DCItemMarket } from "./item-markets";
import { type PumpBondingCurve, formatPumpCurvePrice, getPumpCurveMarketCap } from "./pump-curve";
import type { PumpSwapReserves } from "./pump-swap";

/** Pump.fun coins, including USDC (the project coin), use 6 decimals. */
export const PUMP_COIN_DECIMALS = 6;

export type DCItemMarketLoad =
  | { state: "loading" }
  | { state: "error" }
  | { state: "ready"; market: DCItemMarket };

/** Visible labels are provisional owner copy; see docs/specs/market.md. */
export const ITEM_MARKET_LABELS = {
  loading: "Loading",
  notLaunched: "Not launched yet",
  curve: "On the bonding curve",
  graduated: "On PumpSwap",
  unavailable: "Unavailable",
} as const;

export interface DCItemMarketView {
  /** Price of one item token in USDC, e.g. "0.000002 DC" (DC renders as the USDC mark). */
  price: string;
  marketCap: string;
  status: string;
  /** Pump.fun mint when the item trades; the page links out, it never signs. */
  mint: string | null;
}

/** Keeps `digits` significant digits of a plain decimal string, rounding down. */
export function toSignificant(decimal: string, digits: number): string {
  const [integer, fraction = ""] = decimal.split(".");
  if (integer.replace(/^0+/, "").length >= digits) return integer.replace(/^0+(?=\d)/, "");
  const leadingZeros = /^0*/.exec(fraction)?.[0].length ?? 0;
  const keep = integer === "0" ? leadingZeros + digits : Math.max(0, digits - integer.length);
  const cut = fraction.slice(0, keep).replace(/0+$/, "");
  return cut ? `${integer}.${cut}` : integer;
}

/** Whole quote units with thousands separators, two decimals, rounded down. */
export function formatQuoteUnits(units: bigint, decimals = PUMP_COIN_DECIMALS): string {
  const scale = 10n ** BigInt(decimals);
  const whole = units / scale;
  const cents = ((units % scale) * 100n) / scale;
  const grouped = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${grouped}.${cents.toString().padStart(2, "0")}`;
}

export function describeItemMarket(load: DCItemMarketLoad): DCItemMarketView {
  const empty = { price: "—", marketCap: "—" };
  if (load.state === "loading") return { ...empty, status: ITEM_MARKET_LABELS.loading, mint: null };
  if (load.state === "error") {
    return { ...empty, status: ITEM_MARKET_LABELS.unavailable, mint: null };
  }
  const market = load.market;
  switch (market.status) {
    case "not-launched":
      return { ...empty, status: ITEM_MARKET_LABELS.notLaunched, mint: null };
    case "missing":
    case "wrong-quote":
      return { ...empty, status: ITEM_MARKET_LABELS.unavailable, mint: null };
    case "graduated": {
      // Never a stale curve price: without a readable pool the price stays empty.
      const reserves = market.pool && getPumpSwapPriceReserves(market.pool);
      if (!reserves) return { ...empty, status: ITEM_MARKET_LABELS.graduated, mint: market.mint };
      return {
        ...priceAndCap({ ...reserves, tokenTotalSupply: market.curve.tokenTotalSupply }),
        status: ITEM_MARKET_LABELS.graduated,
        mint: market.mint,
      };
    }
    case "curve":
      return { ...priceAndCap(market.curve), status: ITEM_MARKET_LABELS.curve, mint: market.mint };
  }
}

/** Pool reserves in the curve's shape, or `null` when the pool cannot be priced. */
export function getPumpSwapPriceReserves(
  pool: PumpSwapReserves,
): Pick<
  PumpBondingCurve,
  "virtualQuoteReserves" | "virtualTokenReserves" | "realQuoteReserves" | "realTokenReserves"
> | null {
  if (pool.baseReserves <= 0n || pool.quoteReserves <= 0n) return null;
  return {
    virtualTokenReserves: pool.baseReserves,
    virtualQuoteReserves: pool.quoteReserves,
    realTokenReserves: pool.baseReserves,
    realQuoteReserves: pool.quoteVaultAmount,
  };
}

function priceAndCap(
  reserves: Pick<
    PumpBondingCurve,
    "virtualQuoteReserves" | "virtualTokenReserves" | "tokenTotalSupply"
  >,
) {
  const raw = formatPumpCurvePrice(reserves, PUMP_COIN_DECIMALS, PUMP_COIN_DECIMALS, 12);
  return {
    price: `${toSignificant(raw, 4)} DC`,
    marketCap: `${formatQuoteUnits(getPumpCurveMarketCap(reserves))} DC`,
  };
}
