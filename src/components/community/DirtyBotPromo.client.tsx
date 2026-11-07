"use client";

import { ProjectCard, type ProjectCardProps } from "@/components/ProjectCard";
import {
  decimalSign,
  formatLeaderboardUsd,
  leaderboardEntryToRanking,
  shortWallet,
} from "@/components/leaderboard-presentation";
import { BadgeDelta, LeaderboardRankings, PumpMetricBadge } from "@/components/ui";
import { BarSkeleton, PillSkeleton, RoundedSkeleton } from "@/components/ui/skeleton-shapes";
import type { DCLeaderboardEntry } from "@/dc-chain";
import {
  DCCurrencyMark,
  DCCurrencyText,
  currencyDisplayText,
} from "@/dc-ui/typography/DCCurrencyMark";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useMarketSnapshot } from "@/hooks/useMarketSnapshot";

import rankingStyles from "../ui/leaderboard-rankings.module.scss";
import styles from "./DirtyBotPromo.module.scss";

const MARKET_CAP_MILESTONE_USD = 1_000_000;
const compactUsd = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 1,
  notation: "compact",
  style: "currency",
});

type PromoCardProps = Omit<ProjectCardProps, "title" | "titleAccessory" | "titleContent"> & {
  fallbackTitle: string;
};

function topWalletLabel(entry: DCLeaderboardEntry | null): string | null {
  if (!entry || decimalSign(entry.totalPnlUsd) <= 0) return null;
  return entry.displayName ?? shortWallet(entry.wallet);
}

function topWalletTitle(walletLabel: string | null): string | null {
  if (!walletLabel) return null;
  return `How ${walletLabel} hit #1 trading $USDC`;
}

function pnlDisclosure(entry: DCLeaderboardEntry, generatedAt: string): string {
  return `${formatLeaderboardUsd(entry.totalPnlUsd)} Birdeye-reported all-time Total PNL · snapshot ${generatedAt}`;
}

function finiteNumber(value: string): number | null {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function PromoProfitSkeleton() {
  return (
    <output aria-busy="true" aria-label="Retrieving top wallet PNL">
      <PillSkeleton as="span" style={{ height: 22, verticalAlign: "middle", width: 88 }} />
    </output>
  );
}

function PromoProofSkeleton() {
  return (
    <section
      aria-busy="true"
      aria-label="Top wallet by Birdeye-reported all-time Total PNL"
      aria-live="polite"
      className={styles.proof}
    >
      <span className="sr-only">Retrieving top wallet data.</span>
      <div aria-hidden="true" className={rankingStyles.row}>
        <div className={rankingStyles.identity}>
          <RoundedSkeleton className={rankingStyles.avatar} />
          <div className={rankingStyles.identityCopy}>
            <BarSkeleton className="max-w-full" style={{ height: 20, width: 96 }} />
            <BarSkeleton className="max-w-full" style={{ height: 20, width: 72 }} />
          </div>
        </div>
        <div className={rankingStyles.metric}>
          <span className={rankingStyles.metricLabel}>Position</span>
          <BarSkeleton style={{ height: 20, width: 56 }} />
        </div>
        <div className={rankingStyles.metric}>
          <span className={rankingStyles.metricLabel}>Total PNL</span>
          <BarSkeleton style={{ height: 20, width: 64 }} />
        </div>
      </div>
    </section>
  );
}

function PromoProjectCard({ fallbackTitle, ...props }: PromoCardProps) {
  const { snapshot, status } = useLeaderboard();
  const topWallet =
    status === "ready" || status === "delayed" ? (snapshot?.entries[0] ?? null) : null;
  const walletLabel = topWalletLabel(topWallet);
  const dynamicTitle = topWalletTitle(walletLabel);
  const disclosure = topWallet && snapshot ? pnlDisclosure(topWallet, snapshot.generatedAt) : null;

  return (
    <ProjectCard
      {...props}
      title={dynamicTitle ?? currencyDisplayText(fallbackTitle)}
      titleAccessory={status === "loading" && !snapshot ? <PromoProfitSkeleton /> : undefined}
      titleContent={
        dynamicTitle && walletLabel && topWallet ? (
          <span className={styles.titleText}>
            How <span className={styles.walletName}>{walletLabel}</span> hit #1 trading $
            <DCCurrencyMark />{" "}
            <BadgeDelta
              aria-label={disclosure ?? undefined}
              className={styles.titleBadge}
              deltaType="increase"
              showIcon={false}
              title={disclosure ?? undefined}
              value={`+${formatLeaderboardUsd(topWallet.totalPnlUsd)}`}
              variant="solid"
            />
          </span>
        ) : (
          <DCCurrencyText value={fallbackTitle} />
        )
      }
    />
  );
}

export function DirtyBotPromoPreview(props: PromoCardProps) {
  return <PromoProjectCard {...props} />;
}

export function DirtyBotPromoHeader(props: PromoCardProps) {
  const { fallbackTitle, ...cardProps } = props;
  const { snapshot, status } = useLeaderboard();
  const topWallet =
    status === "ready" || status === "delayed" ? (snapshot?.entries[0] ?? null) : null;
  const walletLabel = topWalletLabel(topWallet);
  const dynamicTitle = topWalletTitle(walletLabel);
  const ranking = topWallet ? leaderboardEntryToRanking(topWallet, "wallet") : null;
  const disclosure = topWallet && snapshot ? pnlDisclosure(topWallet, snapshot.generatedAt) : null;

  return (
    <>
      <ProjectCard
        {...cardProps}
        title={dynamicTitle ?? currencyDisplayText(fallbackTitle)}
        titleAccessory={status === "loading" && !snapshot ? <PromoProfitSkeleton /> : undefined}
        titleContent={
          dynamicTitle && walletLabel && topWallet ? (
            <span className={styles.titleText}>
              How <span className={styles.walletName}>{walletLabel}</span> hit #1 trading $
              <DCCurrencyMark />{" "}
              <BadgeDelta
                aria-label={disclosure ?? undefined}
                className={styles.titleBadge}
                deltaType="increase"
                showIcon={false}
                title={disclosure ?? undefined}
                value={`+${formatLeaderboardUsd(topWallet.totalPnlUsd)}`}
                variant="solid"
              />
            </span>
          ) : (
            <DCCurrencyText value={fallbackTitle} />
          )
        }
      />

      {ranking ? (
        <section
          aria-label={disclosure ?? "Top wallet by Birdeye-reported all-time Total PNL"}
          className={styles.proof}
        >
          <LeaderboardRankings rankings={[ranking]} />
        </section>
      ) : status === "loading" && !snapshot ? (
        <PromoProofSkeleton />
      ) : null}
    </>
  );
}

export function DirtyBotPromoConversion() {
  const { snapshot, status } = useMarketSnapshot();
  const marketCap = status === "ready" && snapshot ? finiteNumber(snapshot.marketCapUsd) : null;
  const progress = marketCap === null ? null : (marketCap / MARKET_CAP_MILESTONE_USD) * 100;
  const boundedProgress = progress === null ? 0 : Math.min(100, Math.max(0, progress));
  const marketDisclosure = snapshot
    ? `Birdeye market-cap estimate · snapshot ${snapshot.generatedAt}`
    : undefined;

  return (
    <section aria-label="$USDC market milestone" className={styles.conversion}>
      {marketCap !== null && progress !== null ? (
        <div className={styles.milestone}>
          <div className={styles.badges}>
            <PumpMetricBadge
              aria-label={marketDisclosure}
              label="Market cap estimate"
              title={marketDisclosure}
              value={compactUsd.format(marketCap)}
            />
            <PumpMetricBadge
              label="Chapter 1 Season 1 Milestone"
              value={compactUsd.format(MARKET_CAP_MILESTONE_USD)}
            />
          </div>
          <div className={styles.progressCopy}>
            <span>Community milestone</span>
            <span>{progress.toFixed(1)}%</span>
          </div>
          <div
            aria-label={`${progress.toFixed(1)}% of the $1 million market-cap milestone`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={Math.round(boundedProgress)}
            className={styles.progressTrack}
            role="progressbar"
            tabIndex={0}
          >
            <span className={styles.progressFill} style={{ width: `${boundedProgress}%` }} />
          </div>
        </div>
      ) : status === "loading" && !snapshot ? (
        <div
          aria-busy="true"
          aria-label="Retrieving market-cap estimate"
          aria-live="polite"
          className={styles.milestone}
        >
          <div className={styles.badges}>
            <div className={rankingStyles.metricBadge}>
              <span className={rankingStyles.metricLabel}>Market cap estimate</span>
              <BarSkeleton style={{ height: 20, width: 64 }} />
            </div>
            <PumpMetricBadge
              label="Chapter 1 Season 1 Milestone"
              value={compactUsd.format(MARKET_CAP_MILESTONE_USD)}
            />
          </div>
          <div className={styles.progressCopy}>
            <span>Community milestone</span>
            <BarSkeleton style={{ height: 20, width: 40 }} />
          </div>
          <PillSkeleton style={{ height: 8, width: "100%" }} />
        </div>
      ) : null}
    </section>
  );
}
