import { address } from "@solana/kit";

import { DC_TOKEN_MINT } from "./config";

export const DC_LEADERBOARD_REFRESH_MS = 3_600_000;
const DC_LEADERBOARD_MAX_INTERVALS = 3;
const DC_LEADERBOARD_FUTURE_SKEW_MS = 300_000;

function readLeaderboardSnapshotPath(value: string | undefined): string {
  const configuredPath = value?.trim();
  if (process.env.NODE_ENV === "production" && !configuredPath) {
    throw new Error("NEXT_PUBLIC_LEADERBOARD_SNAPSHOT_URL is required for a production build");
  }

  const path = configuredPath || "/data/leaderboard.json";
  if (path.startsWith("/") && !path.startsWith("//")) return path;

  const url = new URL(path);
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new TypeError("Leaderboard snapshot URL must be root-relative or HTTPS");
  }
  return url.toString();
}

export const DC_LEADERBOARD_SNAPSHOT_PATH = readLeaderboardSnapshotPath(
  process.env.NEXT_PUBLIC_LEADERBOARD_SNAPSHOT_URL,
);

export interface DCLeaderboardEntry {
  rank: number;
  wallet: string;
  displayName: string | null;
  avatarUrl: string | null;
  positionValueUsd: string;
  totalPnlUsd: string;
  realizedPnlUsd: string;
  unrealizedPnlUsd: string;
}

export interface DCLeaderboardSnapshot {
  schemaVersion: 3;
  source: "birdeye";
  sourceWindow: "all_time";
  metric: "total_pnl";
  currency: "USD";
  tokenMint: string;
  generatedAt: string;
  refreshAfterSeconds: 3600;
  entries: DCLeaderboardEntry[];
}

const DECIMAL = /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/;
const AVATAR_HOSTS = new Set(["images.pump.fun", "ipfs.io", "pump.mypinata.cloud"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function decimal(value: unknown, field: string): string {
  if (typeof value !== "string" || value.length > 64 || !DECIMAL.test(value)) {
    throw new TypeError(`${field} must be a decimal string`);
  }
  return value;
}

function nonNegativeDecimal(value: unknown, field: string): string {
  const parsed = decimal(value, field);
  if (parsed.startsWith("-")) throw new TypeError(`${field} cannot be negative`);
  return parsed;
}

interface FixedDecimal {
  scale: number;
  units: bigint;
}

function fixedDecimal(value: string): FixedDecimal {
  const negative = value.startsWith("-");
  const unsigned = negative ? value.slice(1) : value;
  const [integer, fraction = ""] = unsigned.split(".");
  const units = BigInt(`${integer}${fraction}`);
  return { scale: fraction.length, units: negative ? -units : units };
}

function scaledUnits(value: FixedDecimal, scale: number): bigint {
  return value.units * 10n ** BigInt(scale - value.scale);
}

function compareDecimals(left: string, right: string): number {
  const leftFixed = fixedDecimal(left);
  const rightFixed = fixedDecimal(right);
  const scale = Math.max(leftFixed.scale, rightFixed.scale);
  const leftUnits = scaledUnits(leftFixed, scale);
  const rightUnits = scaledUnits(rightFixed, scale);
  return leftUnits === rightUnits ? 0 : leftUnits > rightUnits ? 1 : -1;
}

function totalMatchesBreakdown(total: string, realized: string, unrealized: string): boolean {
  const totalFixed = fixedDecimal(total);
  const realizedFixed = fixedDecimal(realized);
  const unrealizedFixed = fixedDecimal(unrealized);
  const scale = Math.max(totalFixed.scale, realizedFixed.scale, unrealizedFixed.scale);
  return (
    scaledUnits(totalFixed, scale) ===
    scaledUnits(realizedFixed, scale) + scaledUnits(unrealizedFixed, scale)
  );
}

function solanaAddress(value: unknown, field: string): string {
  if (typeof value !== "string") throw new TypeError(`${field} must be a Solana address`);
  try {
    return String(address(value));
  } catch {
    throw new TypeError(`${field} must be a Solana address`);
  }
}

function hasControlCharacters(value: string): boolean {
  return Array.from(value).some((character) => {
    const codePoint = character.codePointAt(0);
    return codePoint !== undefined && (codePoint <= 31 || codePoint === 127);
  });
}

function nullableDisplayName(value: unknown, field: string): string | null {
  if (value === null) return null;
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > 64 ||
    value.trim() !== value ||
    hasControlCharacters(value)
  ) {
    throw new TypeError(`${field} must be null or a valid display name`);
  }
  return value;
}

function nullableAvatarUrl(value: unknown, field: string): string | null {
  if (value === null) return null;
  if (typeof value !== "string" || value.length > 2_048) {
    throw new TypeError(`${field} must be null or an HTTPS URL`);
  }
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !AVATAR_HOSTS.has(url.hostname)) throw new TypeError();
    if (
      (url.hostname === "ipfs.io" || url.hostname === "pump.mypinata.cloud") &&
      !url.pathname.startsWith("/ipfs/")
    ) {
      throw new TypeError();
    }
    if (url.hostname === "images.pump.fun" && !url.pathname.startsWith("/coin-image/")) {
      throw new TypeError();
    }
    return url.toString();
  } catch {
    throw new TypeError(`${field} must be null or an HTTPS URL`);
  }
}

export function parseDCLeaderboardSnapshot(value: unknown): DCLeaderboardSnapshot {
  if (!isRecord(value)) throw new TypeError("Leaderboard snapshot must be an object");
  if (
    value.schemaVersion !== 3 ||
    value.source !== "birdeye" ||
    value.sourceWindow !== "all_time" ||
    value.metric !== "total_pnl" ||
    value.currency !== "USD" ||
    value.refreshAfterSeconds !== 3600
  ) {
    throw new TypeError("Leaderboard snapshot contract is not supported");
  }
  if (value.tokenMint !== String(DC_TOKEN_MINT)) {
    throw new TypeError("Leaderboard token mint does not match $DC");
  }
  const generatedAt = typeof value.generatedAt === "string" ? new Date(value.generatedAt) : null;
  if (
    !generatedAt ||
    Number.isNaN(generatedAt.getTime()) ||
    generatedAt.toISOString() !== value.generatedAt
  ) {
    throw new TypeError("Leaderboard generatedAt is invalid");
  }
  if (!Array.isArray(value.entries) || value.entries.length === 0 || value.entries.length > 10) {
    throw new TypeError("Leaderboard must contain between 1 and 10 entries");
  }

  const wallets = new Set<string>();
  const entries = value.entries.map((candidate, index): DCLeaderboardEntry => {
    if (!isRecord(candidate)) throw new TypeError(`Leaderboard entry ${index} is invalid`);
    if (candidate.rank !== index + 1) {
      throw new TypeError(`Leaderboard entry ${index} has an invalid rank`);
    }
    const wallet = solanaAddress(candidate.wallet, `Leaderboard entry ${index} wallet`);
    if (wallets.has(wallet)) {
      throw new TypeError(`Leaderboard entry ${index} repeats a wallet`);
    }
    wallets.add(wallet);

    const entry = {
      rank: candidate.rank,
      wallet,
      displayName: nullableDisplayName(candidate.displayName, `entries[${index}].displayName`),
      avatarUrl: nullableAvatarUrl(candidate.avatarUrl, `entries[${index}].avatarUrl`),
      positionValueUsd: nonNegativeDecimal(
        candidate.positionValueUsd,
        `entries[${index}].positionValueUsd`,
      ),
      totalPnlUsd: decimal(candidate.totalPnlUsd, `entries[${index}].totalPnlUsd`),
      realizedPnlUsd: decimal(candidate.realizedPnlUsd, `entries[${index}].realizedPnlUsd`),
      unrealizedPnlUsd: decimal(candidate.unrealizedPnlUsd, `entries[${index}].unrealizedPnlUsd`),
    };
    if (!totalMatchesBreakdown(entry.totalPnlUsd, entry.realizedPnlUsd, entry.unrealizedPnlUsd)) {
      throw new TypeError(`Leaderboard entry ${index} has an inconsistent PNL breakdown`);
    }
    return entry;
  });

  for (let index = 1; index < entries.length; index += 1) {
    if (compareDecimals(entries[index - 1].totalPnlUsd, entries[index].totalPnlUsd) < 0) {
      throw new TypeError("Leaderboard entries are not sorted by total PNL");
    }
  }

  return {
    schemaVersion: 3,
    source: "birdeye",
    sourceWindow: "all_time",
    metric: "total_pnl",
    currency: "USD",
    tokenMint: value.tokenMint,
    generatedAt: value.generatedAt,
    refreshAfterSeconds: 3600,
    entries,
  };
}

export function isDCLeaderboardSnapshotFresh(
  snapshot: DCLeaderboardSnapshot,
  now = Date.now(),
): boolean {
  const age = now - Date.parse(snapshot.generatedAt);
  return (
    age >= -DC_LEADERBOARD_FUTURE_SKEW_MS &&
    age <= snapshot.refreshAfterSeconds * DC_LEADERBOARD_MAX_INTERVALS * 1_000
  );
}
