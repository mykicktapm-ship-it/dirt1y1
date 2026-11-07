"use client";

import { type ReactNode, useId } from "react";
import styles from "./stats-widget.module.scss";

type StatsWidgetProps = {
  label: string;
  value: ReactNode;
  change?: string;
  caption?: string;
  chartData?: readonly number[];
  chartLabel?: string;
  active?: boolean;
};

const chartWidth = 150;
const chartHeight = 60;
const chartInset = 4;

function smoothPath(data: readonly number[]) {
  const values = data.filter(Number.isFinite);
  if (values.length === 0) return "";

  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const range = maximum - minimum;
  const coordinates = values.map((value, index) => ({
    x:
      values.length === 1
        ? chartWidth / 2
        : chartInset + (index * (chartWidth - chartInset * 2)) / (values.length - 1),
    y:
      range === 0
        ? chartHeight / 2
        : chartHeight - chartInset - ((value - minimum) / range) * (chartHeight - chartInset * 2),
  }));
  const start = coordinates[0];
  let path = `M ${start.x} ${start.y}`;

  for (let index = 1; index < coordinates.length; index++) {
    const previous = coordinates[index - 1];
    const current = coordinates[index];
    const middleX = (previous.x + current.x) / 2;
    path += ` C ${middleX} ${previous.y} ${middleX} ${current.y} ${current.x} ${current.y}`;
  }

  return {
    line: path,
    area: `${path} L ${coordinates[coordinates.length - 1].x} ${chartHeight} L ${start.x} ${chartHeight} Z`,
  };
}

export default function StatsWidget({
  label,
  value,
  change,
  caption,
  chartData = [],
  chartLabel,
  active = true,
}: StatsWidgetProps) {
  const gradientId = `stats-gradient-${useId().replace(/:/g, "")}`;
  const paths = smoothPath(chartData);

  return (
    <div className={styles.widget} data-active={active} data-chart={Boolean(paths)}>
      <div className={styles.content}>
        <div className={styles.info}>
          <div className={styles.label}>{label}</div>
          <div className={styles.metric}>
            <span className={styles.value}>{value}</span>
            {change && <span className={styles.change}>{change}</span>}
          </div>
        </div>
        {paths && (
          <svg
            className={styles.chart}
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            preserveAspectRatio="none"
            role="img"
            aria-label={chartLabel}
          >
            <title>{chartLabel}</title>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity={0.34} />
                <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
              </linearGradient>
            </defs>
            {paths && (
              <>
                <path className={styles.area} d={paths.area} fill={`url(#${gradientId})`} />
                <path
                  className={styles.line}
                  d={paths.line}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </>
            )}
          </svg>
        )}
        {caption ? <div className={styles.caption}>{caption}</div> : null}
      </div>
    </div>
  );
}
