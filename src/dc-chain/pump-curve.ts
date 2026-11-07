import {
  type Address,
  address,
  getAddressDecoder,
  getAddressEncoder,
  getProgramDerivedAddress,
} from "@solana/kit";

/**
 * Pump.fun bonding-curve reader. Layout follows `BondingCurve` in the public Pump IDL
 * (github.com/pump-fun/pump-public-docs, idl/pump.json). Read-only: nothing here builds or
 * signs a transaction.
 */
export const PUMP_PROGRAM_ADDRESS = address("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");

const BONDING_CURVE_DISCRIMINATOR = [23, 183, 248, 55, 96, 216, 172, 96] as const;

/** Byte offsets after the 8-byte account discriminator. */
const OFFSET = {
  virtualTokenReserves: 8,
  virtualQuoteReserves: 16,
  realTokenReserves: 24,
  realQuoteReserves: 32,
  tokenTotalSupply: 40,
  complete: 48,
  creator: 49,
  isMayhemMode: 81,
  isCashbackCoin: 82,
  quoteMint: 83,
  creatorFeeBps: 115,
} as const;

/** Oldest supported layout ends after `creator`; quote fields appeared with `create_v2`. */
const MIN_LENGTH = OFFSET.isMayhemMode;
const QUOTE_LAYOUT_LENGTH = OFFSET.creatorFeeBps + 8;

export interface PumpBondingCurve {
  virtualTokenReserves: bigint;
  virtualQuoteReserves: bigint;
  realTokenReserves: bigint;
  realQuoteReserves: bigint;
  tokenTotalSupply: bigint;
  /** True once the curve has sold out; trading continues on PumpSwap. */
  complete: boolean;
  creator: Address;
  isMayhemMode: boolean;
  isCashbackCoin: boolean;
  /** `null` on legacy SOL-paired accounts that predate the quote fields. */
  quoteMint: Address | null;
  creatorFeeBps: bigint | null;
}

function readBool(view: DataView, offset: number): boolean {
  const value = view.getUint8(offset);
  if (value > 1) throw new TypeError("Pump bonding curve has an invalid boolean");
  return value === 1;
}

export function decodePumpBondingCurve(data: Uint8Array): PumpBondingCurve {
  if (data.length < MIN_LENGTH) throw new TypeError("Pump bonding curve account is too short");
  for (const [index, byte] of BONDING_CURVE_DISCRIMINATOR.entries()) {
    if (data[index] !== byte) throw new TypeError("Account is not a Pump bonding curve");
  }

  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const u64 = (offset: number) => view.getBigUint64(offset, true);
  const addressDecoder = getAddressDecoder();
  const readAddress = (offset: number) => addressDecoder.decode(data.subarray(offset, offset + 32));
  const hasQuoteLayout = data.length >= QUOTE_LAYOUT_LENGTH;

  return {
    virtualTokenReserves: u64(OFFSET.virtualTokenReserves),
    virtualQuoteReserves: u64(OFFSET.virtualQuoteReserves),
    realTokenReserves: u64(OFFSET.realTokenReserves),
    realQuoteReserves: u64(OFFSET.realQuoteReserves),
    tokenTotalSupply: u64(OFFSET.tokenTotalSupply),
    complete: readBool(view, OFFSET.complete),
    creator: readAddress(OFFSET.creator),
    isMayhemMode: data.length > OFFSET.isMayhemMode && readBool(view, OFFSET.isMayhemMode),
    isCashbackCoin: data.length > OFFSET.isCashbackCoin && readBool(view, OFFSET.isCashbackCoin),
    quoteMint: hasQuoteLayout ? readAddress(OFFSET.quoteMint) : null,
    creatorFeeBps: hasQuoteLayout ? u64(OFFSET.creatorFeeBps) : null,
  };
}

/** Bonding-curve account address: seeds `["bonding-curve", mint]` under the Pump program. */
export async function findPumpBondingCurveAddress(mint: Address): Promise<Address> {
  const [curve] = await getProgramDerivedAddress({
    programAddress: PUMP_PROGRAM_ADDRESS,
    seeds: ["bonding-curve", getAddressEncoder().encode(mint)],
  });
  return curve;
}

/**
 * Spot price of one whole base token in whole quote tokens, as a decimal string rounded
 * down to `fractionDigits`. Curve invariant: virtual_quote × virtual_token = k.
 */
export function formatPumpCurvePrice(
  curve: Pick<PumpBondingCurve, "virtualQuoteReserves" | "virtualTokenReserves">,
  baseDecimals: number,
  quoteDecimals: number,
  fractionDigits: number,
): string {
  if (curve.virtualTokenReserves === 0n) throw new RangeError("Curve has no token reserves");
  for (const value of [baseDecimals, quoteDecimals, fractionDigits]) {
    if (!Number.isInteger(value) || value < 0 || value > 18) {
      throw new RangeError("Decimals must be integers between 0 and 18");
    }
  }
  const scale = 10n ** BigInt(fractionDigits);
  const numerator = curve.virtualQuoteReserves * 10n ** BigInt(baseDecimals) * scale;
  const denominator = curve.virtualTokenReserves * 10n ** BigInt(quoteDecimals);
  const scaled = numerator / denominator;
  if (fractionDigits === 0) return scaled.toString();
  const padded = scaled.toString().padStart(fractionDigits + 1, "0");
  return `${padded.slice(0, -fractionDigits)}.${padded.slice(-fractionDigits)}`;
}

/** Market cap in quote base units (floor): spot price × total supply. */
export function getPumpCurveMarketCap(
  curve: Pick<
    PumpBondingCurve,
    "virtualQuoteReserves" | "virtualTokenReserves" | "tokenTotalSupply"
  >,
): bigint {
  if (curve.virtualTokenReserves === 0n) throw new RangeError("Curve has no token reserves");
  return (curve.virtualQuoteReserves * curve.tokenTotalSupply) / curve.virtualTokenReserves;
}

type CurveReserves = Pick<
  PumpBondingCurve,
  "virtualQuoteReserves" | "virtualTokenReserves" | "realQuoteReserves" | "realTokenReserves"
>;

function ceilDiv(numerator: bigint, denominator: bigint): bigint {
  return (numerator + denominator - 1n) / denominator;
}

/**
 * Base tokens a buy of `quoteIn` base units moves off the curve, before Pump.fun and creator
 * fees (k = virtual_quote × virtual_token). Capped by the tokens still on the curve.
 * Read-only estimate for presentation: trades happen on Pump.fun.
 */
export function quotePumpCurveBuy(curve: CurveReserves, quoteIn: bigint): bigint {
  if (quoteIn <= 0n) return 0n;
  const k = curve.virtualQuoteReserves * curve.virtualTokenReserves;
  const tokensOut = curve.virtualTokenReserves - ceilDiv(k, curve.virtualQuoteReserves + quoteIn);
  return tokensOut < curve.realTokenReserves ? tokensOut : curve.realTokenReserves;
}

/** Quote base units a sale of `tokensIn` returns from the curve, before fees. */
export function quotePumpCurveSell(curve: CurveReserves, tokensIn: bigint): bigint {
  if (tokensIn <= 0n) return 0n;
  const k = curve.virtualQuoteReserves * curve.virtualTokenReserves;
  const quoteOut = curve.virtualQuoteReserves - ceilDiv(k, curve.virtualTokenReserves + tokensIn);
  return quoteOut < curve.realQuoteReserves ? quoteOut : curve.realQuoteReserves;
}

/**
 * Pump.fun `Global.initial_real_token_reserves` (793,100,000 tokens, 6 decimals) at the time
 * of the public IDL. Verify against the Global account before treating progress as exact.
 */
export const PUMP_INITIAL_REAL_TOKEN_RESERVES = 793_100_000_000_000n;

/**
 * Pump.fun `Global.initial_virtual_token_reserves` (1,073,000,000 tokens, 6 decimals) at the time
 * of the public IDL. Verify against the Global account before treating launch prices as exact.
 */
export const PUMP_INITIAL_VIRTUAL_TOKEN_RESERVES = 1_073_000_000_000_000n;

/**
 * Virtual quote reserves the curve launched with, in quote base units (floor). Every trade keeps
 * `virtual_quote × virtual_token` (up to rounding), so the launch reserves are
 * `k / initial_virtual_token_reserves`; the launch price is this over the same token reserves.
 */
export function getPumpCurveLaunchQuoteReserves(
  curve: Pick<PumpBondingCurve, "virtualQuoteReserves" | "virtualTokenReserves">,
  initialVirtualTokenReserves = PUMP_INITIAL_VIRTUAL_TOKEN_RESERVES,
): bigint {
  return (curve.virtualQuoteReserves * curve.virtualTokenReserves) / initialVirtualTokenReserves;
}

/** Share of the curve allocation already sold, in basis points (0–10,000). */
export function getPumpCurveProgressBps(
  curve: Pick<PumpBondingCurve, "realTokenReserves" | "complete">,
  initialRealTokenReserves = PUMP_INITIAL_REAL_TOKEN_RESERVES,
): bigint {
  if (curve.complete) return 10_000n;
  if (curve.realTokenReserves >= initialRealTokenReserves) return 0n;
  return (
    ((initialRealTokenReserves - curve.realTokenReserves) * 10_000n) / initialRealTokenReserves
  );
}
