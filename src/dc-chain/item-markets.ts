import { type Address, address } from "@solana/kit";

import { type MarketplaceItemId, itemMarketMints } from "../resources/launch";
import { type DCReadRpc, readWithDCFailover } from "./client";
import { DC_TOKEN_MINT } from "./config";
import {
  PUMP_PROGRAM_ADDRESS,
  type PumpBondingCurve,
  decodePumpBondingCurve,
  findPumpBondingCurveAddress,
} from "./pump-curve";
import {
  PUMP_SWAP_PROGRAM_ADDRESS,
  type PumpSwapReserves,
  decodePumpSwapPool,
  findCanonicalPumpSwapPoolAddress,
  getPumpSwapReserves,
  readTokenAccountAmount,
} from "./pump-swap";

/**
 * - `not-launched`: no mint configured yet.
 * - `missing`: mint configured but no curve account found.
 * - `wrong-quote`: the curve is not quoted in the project coin; never show its price as USDC.
 * - `curve`: trading on the Pump.fun bonding curve.
 * - `graduated`: curve complete; price comes from the canonical PumpSwap pool (`pool`), or
 *   `pool: null` when that pool cannot be read or does not match the item.
 */
export type DCItemMarket =
  | { itemId: MarketplaceItemId; status: "not-launched" }
  | { itemId: MarketplaceItemId; status: "missing" | "wrong-quote"; mint: Address }
  | { itemId: MarketplaceItemId; status: "curve"; mint: Address; curve: PumpBondingCurve }
  | {
      itemId: MarketplaceItemId;
      status: "graduated";
      mint: Address;
      curve: PumpBondingCurve;
      pool: PumpSwapReserves | null;
    };

export interface DCItemMarkets {
  slot: bigint;
  markets: DCItemMarket[];
}

type ItemMintMap = Readonly<Record<MarketplaceItemId, string | null>>;

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

/**
 * Reads every launched item curve in one `getMultipleAccounts` call; graduated items add two
 * more (their pools, then the pool vaults).
 */
export async function fetchDCItemMarkets(
  rpc: DCReadRpc,
  mints: ItemMintMap,
  quoteMint: Address,
  abortSignal?: AbortSignal,
): Promise<DCItemMarkets> {
  const entries = (Object.entries(mints) as [MarketplaceItemId, string | null][]).map(
    ([itemId, mint]) => ({ itemId, mint: mint ? address(mint) : null }),
  );
  const launched = entries.filter(
    (entry): entry is { itemId: MarketplaceItemId; mint: Address } => entry.mint !== null,
  );
  const results = new Map<MarketplaceItemId, DCItemMarket>();
  let slot = 0n;

  if (launched.length) {
    const curves = await Promise.all(launched.map(({ mint }) => findPumpBondingCurveAddress(mint)));
    const response = await rpc
      .getMultipleAccounts(curves, { commitment: "confirmed", encoding: "base64" })
      .send({ abortSignal });
    slot = BigInt(response.context.slot);

    for (const [index, { itemId, mint }] of launched.entries()) {
      const account = response.value[index];
      if (!account || account.owner !== PUMP_PROGRAM_ADDRESS) {
        results.set(itemId, { itemId, status: "missing", mint });
        continue;
      }
      const curve = decodePumpBondingCurve(decodeBase64(account.data[0]));
      if (curve.quoteMint !== quoteMint) {
        results.set(itemId, { itemId, status: "wrong-quote", mint });
        continue;
      }
      results.set(
        itemId,
        curve.complete
          ? { itemId, status: "graduated", mint, curve, pool: null }
          : { itemId, status: "curve", mint, curve },
      );
    }

    const graduated = [...results.values()].filter(
      (market): market is Extract<DCItemMarket, { status: "graduated" }> =>
        market.status === "graduated",
    );
    if (graduated.length) {
      const pools = await readGraduatedPools(rpc, graduated, quoteMint, abortSignal);
      for (const market of graduated) {
        results.set(market.itemId, { ...market, pool: pools.get(market.itemId) ?? null });
      }
    }
  }

  return {
    slot,
    markets: entries.map(
      ({ itemId }) => results.get(itemId) ?? { itemId, status: "not-launched" as const },
    ),
  };
}

async function readGraduatedPools(
  rpc: DCReadRpc,
  graduated: readonly { itemId: MarketplaceItemId; mint: Address }[],
  quoteMint: Address,
  abortSignal?: AbortSignal,
): Promise<Map<MarketplaceItemId, PumpSwapReserves>> {
  const addresses = await Promise.all(
    graduated.map(({ mint }) => findCanonicalPumpSwapPoolAddress(mint, quoteMint)),
  );
  const poolAccounts = await rpc
    .getMultipleAccounts(addresses, { commitment: "confirmed", encoding: "base64" })
    .send({ abortSignal });

  const pools = graduated.flatMap(({ itemId, mint }, index) => {
    const account = poolAccounts.value[index];
    if (!account || account.owner !== PUMP_SWAP_PROGRAM_ADDRESS) return [];
    try {
      const pool = decodePumpSwapPool(decodeBase64(account.data[0]));
      return pool.baseMint === mint && pool.quoteMint === quoteMint ? [{ itemId, pool }] : [];
    } catch {
      return [];
    }
  });
  const reserves = new Map<MarketplaceItemId, PumpSwapReserves>();
  if (!pools.length) return reserves;

  const vaults = await rpc
    .getMultipleAccounts(
      pools.flatMap(({ pool }) => [pool.poolBaseTokenAccount, pool.poolQuoteTokenAccount]),
      { commitment: "confirmed", encoding: "base64" },
    )
    .send({ abortSignal });

  for (const [index, { itemId, pool }] of pools.entries()) {
    const base = vaults.value[index * 2];
    const quote = vaults.value[index * 2 + 1];
    if (!base || !quote) continue;
    try {
      reserves.set(
        itemId,
        getPumpSwapReserves(
          pool,
          readTokenAccountAmount(decodeBase64(base.data[0])),
          readTokenAccountAmount(decodeBase64(quote.data[0])),
        ),
      );
    } catch {
      // A vault that cannot be read leaves the item without a price, never with a wrong one.
    }
  }
  return reserves;
}

/** Reads all item markets from the first public RPC endpoint that answers. */
export function getDCItemMarkets(abortSignal?: AbortSignal): Promise<DCItemMarkets> {
  return readWithDCFailover(
    (rpc, signal) => fetchDCItemMarkets(rpc, itemMarketMints, DC_TOKEN_MINT, signal),
    abortSignal,
  );
}
