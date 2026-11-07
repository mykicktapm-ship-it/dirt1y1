import type { Address } from "@solana/kit";

import { type DCReadRpc, dcReadRpcs } from "./client";
import { DC_TOKEN_MINT, LAMPORTS_PER_SOL } from "./config";

export interface DCWalletBalances {
  lamports: bigint;
  slot: bigint;
  sol: number;
  tokenAmount: bigint;
  tokenDecimals: number;
  tokenUiAmount: number;
  tokenUiAmountString: string;
}

const RPC_ATTEMPT_TIMEOUT_MS = 8_000;

function createAttemptSignal(parent?: AbortSignal): {
  cleanup: () => void;
  signal: AbortSignal;
} {
  const controller = new AbortController();
  const abortFromParent = () => controller.abort(parent?.reason);
  const timeout = setTimeout(
    () => controller.abort(new Error("Solana RPC request timed out")),
    RPC_ATTEMPT_TIMEOUT_MS,
  );

  if (parent?.aborted) abortFromParent();
  else parent?.addEventListener("abort", abortFromParent, { once: true });

  return {
    cleanup: () => {
      clearTimeout(timeout);
      parent?.removeEventListener("abort", abortFromParent);
    },
    signal: controller.signal,
  };
}

function formatTokenAmount(amount: bigint, decimals: number): string {
  if (decimals === 0) return amount.toString();

  const padded = amount.toString().padStart(decimals + 1, "0");
  const integer = padded.slice(0, -decimals);
  const fraction = padded.slice(-decimals).replace(/0+$/, "");

  return fraction ? `${integer}.${fraction}` : integer;
}

async function fetchWalletBalances(
  rpc: DCReadRpc,
  owner: Address,
  abortSignal?: AbortSignal,
): Promise<DCWalletBalances> {
  const [solResponse, tokenResponse] = await Promise.all([
    rpc.getBalance(owner, { commitment: "confirmed" }).send({ abortSignal }),
    rpc
      .getTokenAccountsByOwner(
        owner,
        { mint: DC_TOKEN_MINT },
        { commitment: "confirmed", encoding: "jsonParsed" },
      )
      .send({ abortSignal }),
  ]);

  let tokenAmount = 0n;
  let tokenDecimals: number | null = null;

  for (const tokenAccount of tokenResponse.value) {
    const amount = tokenAccount.account.data.parsed.info.tokenAmount;
    if (!Number.isInteger(amount.decimals) || amount.decimals < 0) {
      throw new TypeError("$DC token account has invalid decimals");
    }
    if (tokenDecimals !== null && tokenDecimals !== amount.decimals) {
      throw new TypeError("$DC token accounts disagree on decimals");
    }
    tokenAmount += BigInt(amount.amount);
    tokenDecimals = amount.decimals;
  }

  const lamports = BigInt(solResponse.value);
  const resolvedTokenDecimals = tokenDecimals ?? 0;
  const tokenUiAmountString = formatTokenAmount(tokenAmount, resolvedTokenDecimals);
  const slot =
    BigInt(solResponse.context.slot) < BigInt(tokenResponse.context.slot)
      ? BigInt(solResponse.context.slot)
      : BigInt(tokenResponse.context.slot);

  return {
    lamports,
    slot,
    sol: Number(lamports) / Number(LAMPORTS_PER_SOL),
    tokenAmount,
    tokenDecimals: resolvedTokenDecimals,
    tokenUiAmount: Number(tokenUiAmountString),
    tokenUiAmountString,
  };
}

/**
 * Reads the wallet from the first healthy configured endpoint. An abort is
 * terminal; network/RPC failures move to the next public endpoint.
 */
export async function getDCWalletBalances(
  owner: Address,
  abortSignal?: AbortSignal,
): Promise<DCWalletBalances> {
  abortSignal?.throwIfAborted();
  let lastError: unknown;

  for (const rpc of dcReadRpcs) {
    const attempt = createAttemptSignal(abortSignal);
    try {
      return await fetchWalletBalances(rpc, owner, attempt.signal);
    } catch (error) {
      if (abortSignal?.aborted) throw error;
      lastError = error;
    } finally {
      attempt.cleanup();
    }
  }

  throw lastError ?? new Error("No Solana RPC endpoints are configured");
}
