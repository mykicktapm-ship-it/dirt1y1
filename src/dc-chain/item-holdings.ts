import { type Address, address } from "@solana/kit";

import { type MarketplaceItemId, itemMarketMints } from "../resources/launch";
import { type DCReadRpc, readWithDCFailover } from "./client";

/** Item coins can live under either token program; Pump.fun `create_v2` mints are Token-2022. */
const TOKEN_PROGRAMS = [
  address("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
  address("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"),
] as const;

/** Item coin balance per item, in base units (6 decimals). */
export type DCItemHoldings = Readonly<Record<MarketplaceItemId, bigint>>;

type ItemMintMap = Readonly<Record<MarketplaceItemId, string | null>>;

/**
 * Reads a wallet's balance of every launched item coin: one parsed token-account read per
 * token program. Items that are not launched hold `0n`; no request is made before any launch.
 */
export async function fetchDCItemHoldings(
  rpc: DCReadRpc,
  owner: Address,
  mints: ItemMintMap,
  abortSignal?: AbortSignal,
): Promise<DCItemHoldings> {
  const holdings = Object.fromEntries(Object.keys(mints).map((itemId) => [itemId, 0n])) as Record<
    MarketplaceItemId,
    bigint
  >;
  const byMint = new Map<string, MarketplaceItemId>();
  for (const [itemId, mint] of Object.entries(mints) as [MarketplaceItemId, string | null][]) {
    if (mint) byMint.set(address(mint), itemId);
  }
  if (!byMint.size) return holdings;

  const responses = await Promise.all(
    TOKEN_PROGRAMS.map((programId) =>
      rpc
        .getTokenAccountsByOwner(
          owner,
          { programId },
          { commitment: "confirmed", encoding: "jsonParsed" },
        )
        .send({ abortSignal }),
    ),
  );
  for (const response of responses) {
    for (const { account } of response.value) {
      const { mint, tokenAmount } = account.data.parsed.info;
      const itemId = byMint.get(mint);
      if (itemId) holdings[itemId] += BigInt(tokenAmount.amount);
    }
  }
  return holdings;
}

/** Reads the wallet's item holdings from the first public RPC endpoint that answers. */
export function getDCItemHoldings(owner: Address, abortSignal?: AbortSignal) {
  return readWithDCFailover(
    (rpc, signal) => fetchDCItemHoldings(rpc, owner, itemMarketMints, signal),
    abortSignal,
  );
}
