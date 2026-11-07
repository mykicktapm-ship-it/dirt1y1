"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { DCCurrencyMark } from "@/dc-ui/typography/DCCurrencyMark";
import { type DCItemMarketsLoad, selectItemMarket } from "@/hooks/useItemMarket";
import type { MarketplaceItemId } from "@/resources/launch";
import { marketplaceItems } from "@/resources/marketplace";

import { BentoCard, PreviewChip, cx, smoothPath, useTween } from "./bento-kit";
import styles from "./market-bento.module.scss";
import {
  type Quote,
  SINCE_LAUNCH,
  formatCompact,
  formatPrice,
  formatSignedPercent,
  itemFigures,
  sinceLaunch,
  toQuote,
} from "./market-model";

/* Trenches Market: share of market cap per item, and rows with a since-launch line that link
   to each item page. */

function Sparkline({ values, id }: { values: readonly number[]; id: string }) {
  const W = 96;
  const H = 30;
  const low = Math.min(...values);
  const high = Math.max(...values);
  const pad = (high - low) * 0.15 || 1;
  const Y = (value: number) => H - 3 - ((value - low + pad) / (high - low + 2 * pad)) * (H - 6);
  const points = values.map((value, index): [number, number] => [
    2 + (index / (values.length - 1)) * (W - 6),
    Y(value),
  ]);
  const end = points[points.length - 1];
  const up = values[values.length - 1] >= values[0];
  const line = smoothPath(points);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" className={styles.spark}>
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.16" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line}L${end[0]},${H}L${points[0][0]},${H}Z`} fill={`url(#spark-${id})`} />
      <path d={line} className={styles.sparkLine} />
      <circle cx={end[0]} cy={end[1]} r={3} className={up ? styles.sparkUp : styles.sparkFlat} />
    </svg>
  );
}

export function TrenchesMarketCard({
  current,
  quote = "USDC",
  markets,
  className,
  full = false,
  bare = false,
}: {
  current?: MarketplaceItemId;
  quote?: Quote;
  /** The page's single read of all item curves. */
  markets: DCItemMarketsLoad;
  className?: string;
  full?: boolean;
  /** No background or frame (item page). */
  bare?: boolean;
}) {
  const load = markets;
  const [grown, setGrown] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => setGrown(true)));
    return () => cancelAnimationFrame(frame);
  }, []);

  const rows = marketplaceItems.map((item) => {
    const figures = itemFigures(item.id, selectItemMarket(load, item.id));
    // Sparkline and change both run from launch to now.
    const history = figures.history;
    const change = sinceLaunch(figures)?.change ?? null;
    return { item, figures, history, change };
  });
  const capped = rows.filter((row) => row.figures.marketCap !== null);
  const total = capped.reduce((sum, row) => sum + (row.figures.marketCap ?? 0), 0);
  const shares = [...capped].sort(
    (a, b) => (b.figures.marketCap ?? 0) - (a.figures.marketCap ?? 0),
  );
  const preview = rows.some((row) => row.figures.mode === "preview");
  const listed = full ? rows : shares.filter((row) => row.item.id !== current).slice(0, 3);
  const shown = useTween(toQuote(total, quote));

  return (
    <BentoCard
      label="Trenches Market"
      tone={bare ? "bare" : "depth"}
      className={cx((full || bare) && styles.trenchesFull, className)}
    >
      <div className={styles.row}>
        <h3 className={styles.title}>Trenches Market</h3>
        <span className={styles.muted}>{marketplaceItems.length} items</span>
      </div>
      <div className={cx(styles.row, styles.trenchesFigure)}>
        <span className={styles.big}>
          {total ? formatCompact(shown) : "—"}
          {total > 0 && (
            <span className={styles.bigUnit}>{quote === "USDC" ? <DCCurrencyMark /> : "SOL"}</span>
          )}
        </span>
        <span>
          <span className={styles.muted}>Market cap </span>
          <PreviewChip show={preview} />
        </span>
      </div>
      {total > 0 && (
        <>
          <div className={styles.shareBar} aria-hidden="true">
            {shares.map((row, index) => (
              <div
                key={row.item.id}
                className={styles.shareSegment}
                style={{
                  flexBasis: `calc(${((row.figures.marketCap ?? 0) / total) * 100}% - 3px)`,
                  opacity: Math.max(0.2, 0.95 - index * 0.12),
                  transform: grown ? "scaleX(1)" : "scaleX(0)",
                  transitionDelay: `${0.1 + index * 0.06}s`,
                }}
              />
            ))}
          </div>
          <div className={styles.shareLabels}>
            {shares.slice(0, 3).map((row) => (
              <span
                key={row.item.id}
                className={cx(styles.mono, styles.muted)}
                style={{
                  flexBasis: `calc(${((row.figures.marketCap ?? 0) / total) * 100}% - 3px)`,
                }}
              >
                {row.item.title} {Math.round(((row.figures.marketCap ?? 0) / total) * 100)}%
              </span>
            ))}
          </div>
        </>
      )}
      <ul className={cx(styles.trenchesList, full && styles.trenchesListFull)}>
        {listed.map(({ item, figures, history, change }) => (
          <li key={item.id}>
            <Link
              href={`/market/${item.id}/`}
              prefetch={false}
              className={cx(styles.trenchesRow, item.id === current && styles.trenchesCurrent)}
              aria-current={item.id === current ? "page" : undefined}
            >
              <span className={styles.trenchesName}>
                <span>{item.title}</span>
                <span className={cx(styles.mono, styles.muted)}>
                  {figures.mode === "preview" ? `Preview · ${SINCE_LAUNCH}` : SINCE_LAUNCH}
                </span>
              </span>
              {history ? (
                <Sparkline values={history} id={item.id} />
              ) : (
                <span className={styles.spark} />
              )}
              <span className={styles.trenchesPrice}>
                <span className={styles.mono}>
                  {figures.price === null ? "—" : formatPrice(toQuote(figures.price, quote))}
                </span>
                <span
                  className={cx(
                    styles.mono,
                    change !== null && change >= 0 ? styles.accent : styles.muted,
                  )}
                >
                  {change === null ? "—" : formatSignedPercent(change)}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </BentoCard>
  );
}
