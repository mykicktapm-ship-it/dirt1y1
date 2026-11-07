import { DC_TOKEN_MINT } from "./config";

export const DC_MARKET_REFRESH_MS = 3_600_000;
const DC_MARKET_MAX_INTERVALS = 3;
const DC_MARKET_FUTURE_SKEW_MS = 300_000;

function readMarketSnapshotPath(value: string | undefined): string {
  const configuredPath = value?.trim();
  if (process.env.NODE_ENV === "production" && !configuredPath) {
    throw new Error("NEXT_PUBLIC_MARKET_SNAPSHOT_URL is required for a production build");
  }

  const path = configuredPath || "/data/market.json";
  if (path.startsWith("/") && !path.startsWith("//")) return path;

  const url = new URL(path);
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new TypeError("Market snapshot URL must be root-relative or HTTPS");
  }
  return url.toString();
}

export const DC_MARKET_SNAPSHOT_PATH = readMarketSnapshotPath(
  process.env.NEXT_PUBLIC_MARKET_SNAPSHOT_URL,
);

export interface DCMarketSnapshot {
  schemaVersion: 1;
  source: "birdeye";
  currency: "USD";
  tokenMint: string;
  generatedAt: string;
  refreshAfterSeconds: 3600;
  priceUsd: string;
  marketCapUsd: string;
}

const NON_NEGATIVE_DECIMAL = /^(?:0|[1-9]\d*)(?:\.\d+)?$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function decimal(value: unknown, field: string, allowZero: boolean): string {
  if (
    typeof value !== "string" ||
    value.length > 96 ||
    !NON_NEGATIVE_DECIMAL.test(value) ||
    (!allowZero && /^0(?:\.0+)?$/.test(value))
  ) {
    throw new TypeError(
      `${field} must be a ${allowZero ? "non-negative" : "positive"} decimal string`,
    );
  }
  return value;
}

export function parseDCMarketSnapshot(value: unknown): DCMarketSnapshot {
  if (!isRecord(value)) throw new TypeError("Market snapshot must be an object");
  if (
    value.schemaVersion !== 1 ||
    value.source !== "birdeye" ||
    value.currency !== "USD" ||
    value.refreshAfterSeconds !== 3600
  ) {
    throw new TypeError("Market snapshot contract is not supported");
  }
  if (value.tokenMint !== String(DC_TOKEN_MINT)) {
    throw new TypeError("Market snapshot token mint does not match $DC");
  }

  const generatedAt = typeof value.generatedAt === "string" ? new Date(value.generatedAt) : null;
  if (
    !generatedAt ||
    Number.isNaN(generatedAt.getTime()) ||
    generatedAt.toISOString() !== value.generatedAt
  ) {
    throw new TypeError("Market snapshot generatedAt is invalid");
  }

  return {
    schemaVersion: 1,
    source: "birdeye",
    currency: "USD",
    tokenMint: value.tokenMint,
    generatedAt: value.generatedAt,
    refreshAfterSeconds: 3600,
    priceUsd: decimal(value.priceUsd, "priceUsd", false),
    marketCapUsd: decimal(value.marketCapUsd, "marketCapUsd", true),
  };
}

export function isDCMarketSnapshotFresh(snapshot: DCMarketSnapshot, now = Date.now()): boolean {
  const age = now - Date.parse(snapshot.generatedAt);
  return (
    age >= -DC_MARKET_FUTURE_SKEW_MS &&
    age <= snapshot.refreshAfterSeconds * DC_MARKET_MAX_INTERVALS * 1_000
  );
}
