import type { LeaderboardRankingItem } from "@/components/ui/leaderboard-rankings";
import type { DCLeaderboardEntry } from "@/dc-chain";

export function shortWallet(wallet: string): string {
  return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
}

export function formatLeaderboardUsd(value: string): string {
  const negative = value.startsWith("-");
  const unsigned = negative ? value.slice(1) : value;
  const [integer, fraction = ""] = unsigned.split(".");
  let cents = BigInt(integer) * 100n + BigInt(fraction.slice(0, 2).padEnd(2, "0"));
  if ((fraction[2] ?? "0") >= "5") cents += 1n;

  const dollars = cents / 100n;
  const remainder = (cents % 100n).toString().padStart(2, "0");
  const sign = negative && cents !== 0n ? "-" : "";
  return `${sign}$${new Intl.NumberFormat("en-US").format(dollars)}.${remainder}`;
}

export function decimalSign(value: string): -1 | 0 | 1 {
  const unsigned = value.startsWith("-") ? value.slice(1) : value;
  const isZero = !Array.from(unsigned).some((character) => character >= "1" && character <= "9");
  if (isZero) return 0;
  return value.startsWith("-") ? -1 : 1;
}

export function leaderboardEntryToRanking(
  entry: DCLeaderboardEntry,
  anonymousLabel: "rank" | "wallet" = "rank",
): LeaderboardRankingItem {
  return {
    userId: entry.wallet,
    rank: entry.rank,
    userName:
      entry.displayName ??
      (anonymousLabel === "wallet" ? shortWallet(entry.wallet) : `#${entry.rank}`),
    byline: shortWallet(entry.wallet),
    avatarUrl: entry.avatarUrl ?? undefined,
    avatarFallback: entry.displayName ?? entry.wallet.slice(0, 2),
    positionValue: 0,
    positionLabel: formatLeaderboardUsd(entry.positionValueUsd),
    value: decimalSign(entry.totalPnlUsd),
    valueLabel: formatLeaderboardUsd(entry.totalPnlUsd),
    displayed: true,
  };
}
