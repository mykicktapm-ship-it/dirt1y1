"use client";

import { useEffect, useId, useRef, useState } from "react";
import { DCCurrencyText, currencyDisplayText } from "../typography/DCCurrencyMark";
import styles from "./interactive-chart.module.scss";

export interface DCChartPoint {
  id: string;
  label: string;
  /** Presentation coordinates only; financial calculations remain in DC Chain. */
  value: number;
  formattedValue: string;
}

interface DCInteractiveChartProps {
  points: readonly DCChartPoint[];
  positive: boolean;
  label: string;
  /** Presentation height; the dashboard keeps its original 180px default. */
  height?: number;
  /** Editorial scenes can replace the default gain/loss colors. */
  accentColor?: string;
  /** Keep the trading glow only where it belongs to the visual language. */
  glow?: boolean;
}

export function DCInteractiveChart({
  points,
  positive,
  label,
  height = 180,
  accentColor,
  glow = true,
}: DCInteractiveChartProps) {
  const accessibleLabel = currencyDisplayText(label);
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(352);
  const [active, setActive] = useState<number | null>(null);
  const chartId = useId().replace(/:/g, "");
  const gradientId = `${chartId}-area`;
  const glowId = `${chartId}-glow`;
  const padding = { top: 20, right: 20, bottom: 30, left: 50 };
  const innerWidth = Math.max(1, width - padding.left - padding.right);
  const innerHeight = height - padding.top - padding.bottom;
  const values = points.map((point) => point.value);
  const minimum = values.length ? Math.min(...values) : 0;
  const maximum = values.length ? Math.max(...values) : 1;
  const spread = maximum - minimum || Math.abs(maximum) * 0.03 || 1;
  const low = minimum - spread * 0.08;
  const high = maximum + spread * 0.08;
  const xFor = (index: number) =>
    points.length <= 1 ? 0 : (index / (points.length - 1)) * innerWidth;
  const yFor = (value: number) => innerHeight - ((value - low) / (high - low)) * innerHeight;
  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${xFor(index)} ${yFor(point.value)}`)
    .join(" ");
  const selectedIndex = active === null ? null : Math.min(active, points.length - 1);
  const selected = selectedIndex === null ? null : points[selectedIndex];
  const color = accentColor ?? (positive ? "#10b981" : "#ef4444");

  useEffect(() => {
    const node = container.current;
    if (!node) return;
    const update = () => setWidth(Math.max(1, node.clientWidth));
    update();
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(update);
      observer.observe(node);
      return () => observer.disconnect();
    }
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  function selectAt(clientX: number) {
    const rect = container.current?.getBoundingClientRect();
    if (!rect || points.length === 0) return;
    const x = clientX - rect.left - padding.left;
    if (x < 0 || x > innerWidth) {
      setActive(null);
      return;
    }
    setActive(Math.round((x / innerWidth) * (points.length - 1)));
  }

  return (
    <div
      ref={container}
      className={styles.chart}
      style={{ height }}
      onPointerMove={(event) => selectAt(event.clientX)}
      onPointerDown={(event) => selectAt(event.clientX)}
      onPointerLeave={() => setActive(null)}
    >
      <input
        className={styles.srOnly}
        type="range"
        min={0}
        max={Math.max(0, points.length - 1)}
        value={selectedIndex ?? Math.max(0, points.length - 1)}
        disabled={points.length === 0}
        aria-label={`${accessibleLabel}. Inspect trades.`}
        aria-valuetext={
          selected
            ? currencyDisplayText(`${selected.label}: ${selected.formattedValue}`)
            : undefined
        }
        onChange={(event) => setActive(Number(event.target.value))}
        onFocus={() => setActive(Math.max(0, points.length - 1))}
        onBlur={() => setActive(null)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setActive(null);
        }}
      />
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={accessibleLabel}
      >
        <title>{accessibleLabel}</title>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="50%" stopColor={color} stopOpacity="0.1" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
          <filter id={glowId} x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g transform={`translate(${padding.left},${padding.top})`}>
          {[0, 1, 2, 3].map((index) => {
            const value = low + (index * (high - low)) / 3;
            const y = yFor(value);
            return (
              <g key={index}>
                <line
                  x1={0}
                  y1={y}
                  x2={innerWidth}
                  y2={y}
                  className={styles.grid}
                  strokeDasharray="2 4"
                />
                {index % 2 === 0 && (
                  <text
                    x={-8}
                    y={y}
                    textAnchor="end"
                    dominantBaseline="middle"
                    className={styles.axis}
                  >
                    {value < 1
                      ? value.toFixed(3)
                      : value < 100
                        ? value.toFixed(2)
                        : Math.round(value)}
                  </text>
                )}
              </g>
            );
          })}
          {points.length > 1 && (
            <path
              d={`${path} L ${innerWidth} ${innerHeight} L 0 ${innerHeight} Z`}
              fill={`url(#${gradientId})`}
            />
          )}
          <path
            data-chart-line="true"
            d={path}
            fill="none"
            stroke={color}
            strokeWidth={glow ? 3 : 2}
            filter={glow ? `url(#${glowId})` : undefined}
          />
          {selected && selectedIndex !== null && (
            <g>
              <line
                x1={xFor(selectedIndex)}
                y1={0}
                x2={xFor(selectedIndex)}
                y2={innerHeight}
                className={styles.crosshair}
              />
              <line
                x1={0}
                y1={yFor(selected.value)}
                x2={innerWidth}
                y2={yFor(selected.value)}
                className={styles.crosshair}
              />
              <circle
                cx={xFor(selectedIndex)}
                cy={yFor(selected.value)}
                r={glow ? 6 : 4}
                className={styles.point}
                filter={glow ? `url(#${glowId})` : undefined}
              />
            </g>
          )}
          <text x={0} y={innerHeight + 20} className={styles.axis}>
            Start
          </text>
          <text x={innerWidth} y={innerHeight + 20} textAnchor="end" className={styles.axis}>
            Latest trade
          </text>
        </g>
      </svg>
      {selected && selectedIndex !== null && (
        <div
          className={styles.tooltip}
          style={{
            top: Math.max(8, padding.top + yFor(selected.value) - 55),
            left: Math.max(8, Math.min(padding.left + xFor(selectedIndex) - 75, width - 148)),
          }}
        >
          <div>
            <span>Price</span>
            <strong>
              <DCCurrencyText value={selected.formattedValue} />
            </strong>
          </div>
          <div>
            <span>Trade</span>
            <strong>{selected.label}</strong>
          </div>
        </div>
      )}
      <span className={styles.srOnly} aria-live="polite">
        {selected ? currencyDisplayText(`${selected.label}: ${selected.formattedValue}`) : ""}
      </span>
    </div>
  );
}
