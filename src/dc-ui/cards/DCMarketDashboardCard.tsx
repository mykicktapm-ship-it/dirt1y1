"use client";

import type { ReactNode } from "react";
import { type DCChartPoint, DCInteractiveChart } from "../charts/DCInteractiveChart";
import { DCCurrencyText } from "../typography/DCCurrencyMark";
import styles from "./market-dashboard-card.module.scss";

interface DashboardMetric {
  label: string;
  value: string;
  tone?: "positive" | "negative";
}

interface DCMarketDashboardCardProps {
  title: string;
  symbol: string;
  icon: ReactNode;
  price: string;
  change: string;
  positive: boolean;
  points: readonly DCChartPoint[];
  metrics: readonly DashboardMetric[];
}

export function DCDashboardPanel({
  children,
  className,
  label,
}: { children: ReactNode; className?: string; label: string }) {
  return (
    <section aria-label={label} className={`${styles.panel} ${className ?? ""}`}>
      {children}
    </section>
  );
}

/** Market card on the site's shared visual tokens. */
export function DCMarketDashboardCard({
  title,
  symbol,
  icon,
  price,
  change,
  positive,
  points,
  metrics,
}: DCMarketDashboardCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.surface}>
        <header className={styles.header}>
          <div className={styles.identity}>
            <div className={styles.icon}>{icon}</div>
            <div className={styles.name}>
              <h2 title={title}>{title}</h2>
              <p>
                <DCCurrencyText value={symbol} />
              </p>
            </div>
          </div>
          <div className={styles.quote}>
            <strong>
              <DCCurrencyText value={price} />
            </strong>
            <span className={positive ? styles.positive : styles.negative}>
              {positive ? "↗" : "↘"} {change}
            </span>
          </div>
        </header>
        <div className={styles.chartFrame}>
          <DCInteractiveChart
            points={points}
            positive={positive}
            label={`${title} share price in USDC, preview trade history`}
          />
        </div>
        <dl className={styles.metrics}>
          {metrics.map((metric) => (
            <div key={metric.label}>
              <dt>{metric.label}</dt>
              <dd className={metric.tone ? styles[metric.tone] : undefined}>
                <DCCurrencyText value={metric.value} />
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </article>
  );
}
