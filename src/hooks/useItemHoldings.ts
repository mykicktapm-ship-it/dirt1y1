"use client";

import { address } from "@solana/kit";
import { useConnectedWallet } from "@solana/kit-plugin-wallet/react";
import { useEffect, useState } from "react";

import { useDCChain } from "@/dc-chain";
import { type DCItemHoldings, getDCItemHoldings } from "@/dc-chain/item-holdings";
import { itemMarketMints } from "@/resources/launch";

const nothingLaunched = Object.values(itemMarketMints).every((mint) => mint === null);

/**
 * The connected wallet's item coin balances; `null` while no wallet is connected or the read
 * has not answered. Refreshes when the wallet changes and when the tab becomes visible again
 * (for example after a trade on Pump.fun).
 */
export function useItemHoldings(): DCItemHoldings | null {
  const { client } = useDCChain();
  const owner = useConnectedWallet(client)?.account.address;
  const [result, setResult] = useState<{ owner: string; holdings: DCItemHoldings } | null>(null);

  useEffect(() => {
    if (!owner || nothingLaunched) return;
    let controller: AbortController | null = null;
    const read = async () => {
      if (document.hidden) return;
      controller?.abort();
      const own = new AbortController();
      controller = own;
      try {
        const holdings = await getDCItemHoldings(address(owner), own.signal);
        if (!own.signal.aborted) setResult({ owner, holdings });
      } catch {
        // Keep the last answer; the next visibility change retries.
      }
    };
    const onVisibility = () => {
      if (!document.hidden) void read();
    };
    void read();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      controller?.abort();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [owner]);

  if (!owner) return null;
  if (nothingLaunched) return emptyHoldings;
  return result?.owner === owner ? result.holdings : null;
}

const emptyHoldings = Object.fromEntries(
  Object.keys(itemMarketMints).map((itemId) => [itemId, 0n]),
) as DCItemHoldings;
