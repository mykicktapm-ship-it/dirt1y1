import battlePassRules from "../../public/data/battle-pass.json";

const LAMPORTS_PER_SOL = 1_000_000_000n;

/** Product-owned display levels derived from the wallet's native SOL balance. */
export interface TierInfo {
  level: number;
  minimumLamports: bigint;
  minimumSol: number;
  name: string;
}

export const BATTLE_PASS_RULESET_VERSION = battlePassRules.rulesetVersion;

export const USER_TIERS: readonly TierInfo[] = Object.freeze(
  battlePassRules.levels.map((tier) => {
    const minimumLamports = BigInt(tier.minimumLamports);
    return Object.freeze({
      level: tier.level,
      minimumLamports,
      minimumSol: Number(minimumLamports) / Number(LAMPORTS_PER_SOL),
      name: tier.name,
    });
  }),
);

export interface TierProgress {
  current: TierInfo;
  next: TierInfo | null;
  progress: number;
  remainingSol: number;
}

export function getUserTier(lamports: bigint | null): TierInfo {
  if (lamports === null) return USER_TIERS[0];

  for (let index = USER_TIERS.length - 1; index >= 0; index -= 1) {
    const tier = USER_TIERS[index];
    if (lamports >= tier.minimumLamports) return tier;
  }

  return USER_TIERS[0];
}

export function getTierProgress(lamports: bigint | null): TierProgress {
  const current = getUserTier(lamports);
  const next = USER_TIERS[current.level + 1] ?? null;

  if (lamports === null) {
    return { current, next: USER_TIERS[1], progress: 0, remainingSol: 0.1 };
  }

  if (!next) {
    return { current, next: null, progress: 1, remainingSol: 0 };
  }

  const range = next.minimumLamports - current.minimumLamports;
  const elapsed = lamports - current.minimumLamports;
  const progress = Math.min(1, Math.max(0, Number(elapsed) / Number(range)));

  return {
    current,
    next,
    progress,
    remainingSol: Number(next.minimumLamports - lamports) / Number(LAMPORTS_PER_SOL),
  };
}
