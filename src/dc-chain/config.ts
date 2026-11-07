import { address, mainnet } from "@solana/kit";

import { usdcMint } from "../resources/launch";

const DEFAULT_MAINNET_RPC_URL = "https://api.mainnet-beta.solana.com";

function isLoopback(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

function readPublicRpcUrl(value: string, subscriptions = false): string {
  const url = new URL(value);
  const secureProtocol = subscriptions ? "wss:" : "https:";
  const developmentProtocol = subscriptions ? "ws:" : "http:";
  const isDevelopmentLoopback =
    process.env.NODE_ENV !== "production" &&
    url.protocol === developmentProtocol &&
    isLoopback(url.hostname);

  if (url.protocol !== secureProtocol && !isDevelopmentLoopback) {
    throw new TypeError(`Solana RPC URL must use ${secureProtocol}`);
  }
  if (url.username || url.password) {
    throw new TypeError("Solana RPC URL cannot contain basic-auth credentials");
  }
  if (process.env.NODE_ENV === "production" && url.hostname === "api.mainnet-beta.solana.com") {
    throw new TypeError("Production builds require a dedicated browser-safe Solana RPC endpoint");
  }

  return url.toString();
}

function readPublicUrlList(value: string | undefined): readonly string[] {
  const urls = value
    ?.split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (!urls?.length) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("NEXT_PUBLIC_SOLANA_RPC_URLS is required for a production build");
    }
    return [DEFAULT_MAINNET_RPC_URL];
  }

  return [...new Set(urls.map((url) => readPublicRpcUrl(url)))];
}

/** Wallet Standard chain identifier used by the browser wallet registry. */
export const DC_SOLANA_CHAIN = "solana:mainnet" as const;

/**
 * Ordered public RPC endpoints. These values are embedded into the static
 * bundle and therefore must never contain unrestricted or privileged secrets.
 */
export const DC_SOLANA_RPC_URLS = readPublicUrlList(
  process.env.NEXT_PUBLIC_SOLANA_RPC_URLS ?? process.env.NEXT_PUBLIC_SOLANA_RPC_URL,
).map((url) => mainnet(url));

export const DC_SOLANA_RPC_URL = DC_SOLANA_RPC_URLS[0];

export const DC_SOLANA_RPC_SUBSCRIPTIONS_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_SUBSCRIPTIONS_URL
  ? mainnet(readPublicRpcUrl(process.env.NEXT_PUBLIC_SOLANA_RPC_SUBSCRIPTIONS_URL, true))
  : undefined;

/** USDC (the project coin); set in `src/resources/launch.ts`. */
export const DC_TOKEN_MINT = address(usdcMint);

export const LAMPORTS_PER_SOL = 1_000_000_000n;
