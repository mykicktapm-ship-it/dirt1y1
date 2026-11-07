import {
  type Address,
  address,
  getAddressDecoder,
  getAddressEncoder,
  getProgramDerivedAddress,
  getU16Encoder,
} from "@solana/kit";

import { PUMP_PROGRAM_ADDRESS } from "./pump-curve";

/**
 * PumpSwap pool reader for items whose bonding curve completed. Layout follows `Pool` in the
 * public PumpSwap IDL (github.com/pump-fun/pump-public-docs, idl/pump_amm.json). Read-only:
 * nothing here builds or signs a transaction.
 */
export const PUMP_SWAP_PROGRAM_ADDRESS = address("pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA");

const POOL_DISCRIMINATOR = [241, 154, 109, 4, 17, 177, 109, 188] as const;

/** Pools created by the Pump program `migrate` instruction use index 0 (PUMP_SWAP_README). */
const CANONICAL_POOL_INDEX = 0;

/** Byte offsets after the 8-byte account discriminator. */
const OFFSET = {
  baseMint: 43,
  quoteMint: 75,
  poolBaseTokenAccount: 139,
  poolQuoteTokenAccount: 171,
  virtualQuoteReserves: 245,
} as const;

/** Oldest supported layout ends after the vault addresses; `virtual_quote_reserves` came later. */
const MIN_LENGTH = OFFSET.poolQuoteTokenAccount + 32;
const VIRTUAL_LAYOUT_LENGTH = OFFSET.virtualQuoteReserves + 16;

/** SPL Token and Token-2022 accounts both keep `amount` (u64) after mint and owner. */
const TOKEN_ACCOUNT_AMOUNT_OFFSET = 64;

export interface PumpSwapPool {
  baseMint: Address;
  quoteMint: Address;
  poolBaseTokenAccount: Address;
  poolQuoteTokenAccount: Address;
  /** Signed; may be negative (NEGATIVE_VIRTUAL_QUOTE_RESERVES). `0n` on older layouts. */
  virtualQuoteReserves: bigint;
}

/** Base reserve and effective quote reserve of a pool, both in base units. */
export interface PumpSwapReserves {
  baseReserves: bigint;
  /** `pool_quote_token_account.amount + virtual_quote_reserves`. */
  quoteReserves: bigint;
  /** Raw quote vault balance: the most a sale can take out. */
  quoteVaultAmount: bigint;
}

export function decodePumpSwapPool(data: Uint8Array): PumpSwapPool {
  if (data.length < MIN_LENGTH) throw new TypeError("PumpSwap pool account is too short");
  for (const [index, byte] of POOL_DISCRIMINATOR.entries()) {
    if (data[index] !== byte) throw new TypeError("Account is not a PumpSwap pool");
  }
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const addressDecoder = getAddressDecoder();
  const readAddress = (offset: number) => addressDecoder.decode(data.subarray(offset, offset + 32));
  const virtualQuoteReserves =
    data.length >= VIRTUAL_LAYOUT_LENGTH
      ? (view.getBigInt64(OFFSET.virtualQuoteReserves + 8, true) << 64n) +
        view.getBigUint64(OFFSET.virtualQuoteReserves, true)
      : 0n;

  return {
    baseMint: readAddress(OFFSET.baseMint),
    quoteMint: readAddress(OFFSET.quoteMint),
    poolBaseTokenAccount: readAddress(OFFSET.poolBaseTokenAccount),
    poolQuoteTokenAccount: readAddress(OFFSET.poolQuoteTokenAccount),
    virtualQuoteReserves,
  };
}

export function readTokenAccountAmount(data: Uint8Array): bigint {
  if (data.length < TOKEN_ACCOUNT_AMOUNT_OFFSET + 8) {
    throw new TypeError("Token account is too short");
  }
  return new DataView(data.buffer, data.byteOffset, data.byteLength).getBigUint64(
    TOKEN_ACCOUNT_AMOUNT_OFFSET,
    true,
  );
}

/**
 * Canonical pool of a graduated Pump coin: seeds `["pool", index, creator, base, quote]`, where
 * the creator is the Pump program's `["pool-authority", mint]` PDA (as in the PumpSwap SDK's
 * `canonicalPumpPoolPda`). Callers check the decoded mints before trusting the pool.
 */
export async function findCanonicalPumpSwapPoolAddress(
  mint: Address,
  quoteMint: Address,
): Promise<Address> {
  const encoder = getAddressEncoder();
  const [authority] = await getProgramDerivedAddress({
    programAddress: PUMP_PROGRAM_ADDRESS,
    seeds: ["pool-authority", encoder.encode(mint)],
  });
  const [pool] = await getProgramDerivedAddress({
    programAddress: PUMP_SWAP_PROGRAM_ADDRESS,
    seeds: [
      "pool",
      getU16Encoder().encode(CANONICAL_POOL_INDEX),
      encoder.encode(authority),
      encoder.encode(mint),
      encoder.encode(quoteMint),
    ],
  });
  return pool;
}

export function getPumpSwapReserves(
  pool: Pick<PumpSwapPool, "virtualQuoteReserves">,
  baseVaultAmount: bigint,
  quoteVaultAmount: bigint,
): PumpSwapReserves {
  return {
    baseReserves: baseVaultAmount,
    quoteReserves: quoteVaultAmount + pool.virtualQuoteReserves,
    quoteVaultAmount,
  };
}
