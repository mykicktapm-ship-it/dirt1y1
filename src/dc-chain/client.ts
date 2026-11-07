import { createClient, createSolanaRpc } from "@solana/kit";
import { solanaRpcConnection } from "@solana/kit-plugin-rpc";
import { walletSigner } from "@solana/kit-plugin-wallet";

import {
  DC_SOLANA_CHAIN,
  DC_SOLANA_RPC_SUBSCRIPTIONS_URL,
  DC_SOLANA_RPC_URL,
  DC_SOLANA_RPC_URLS,
} from "./config";

export function createDCChainClient() {
  const rpcConfig = DC_SOLANA_RPC_SUBSCRIPTIONS_URL
    ? {
        rpcUrl: DC_SOLANA_RPC_URL,
        rpcSubscriptionsUrl: DC_SOLANA_RPC_SUBSCRIPTIONS_URL,
      }
    : { rpcUrl: DC_SOLANA_RPC_URL };

  return createClient()
    .use(
      walletSigner({
        autoConnect: true,
        chain: DC_SOLANA_CHAIN,
        storageKey: "dc-wallet",
      }),
    )
    .use(solanaRpcConnection(rpcConfig));
}

/** One client instance per browser bundle and one inert SSR-safe instance. */
export const dcChainClient = createDCChainClient();

/** Ordered read clients; requests can move to the next endpoint on failure. */
export const dcReadRpcs = DC_SOLANA_RPC_URLS.map((url) => createSolanaRpc(url));

export type DCChainClient = typeof dcChainClient;
export type DCReadRpc = (typeof dcReadRpcs)[number];

const RPC_ATTEMPT_TIMEOUT_MS = 8_000;

/**
 * Runs one read against each endpoint in order until one succeeds: abort is terminal, RPC
 * errors and timeouts try the next endpoint.
 */
export async function readWithDCFailover<T>(
  read: (rpc: DCReadRpc, abortSignal: AbortSignal) => Promise<T>,
  abortSignal?: AbortSignal,
): Promise<T> {
  abortSignal?.throwIfAborted();
  let lastError: unknown;

  for (const rpc of dcReadRpcs) {
    const controller = new AbortController();
    const abortFromParent = () => controller.abort(abortSignal?.reason);
    const timeout = setTimeout(
      () => controller.abort(new Error("Solana RPC request timed out")),
      RPC_ATTEMPT_TIMEOUT_MS,
    );
    abortSignal?.addEventListener("abort", abortFromParent, { once: true });
    try {
      return await read(rpc, controller.signal);
    } catch (error) {
      if (abortSignal?.aborted) throw error;
      lastError = error;
    } finally {
      clearTimeout(timeout);
      abortSignal?.removeEventListener("abort", abortFromParent);
    }
  }

  throw lastError ?? new Error("No Solana RPC endpoints are configured");
}
