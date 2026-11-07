"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { type ReactNode, useMemo } from "react";

import { PREVIEW_FLOW_MONTHS, PREVIEW_WEEK_DAYS } from "@/components/item-market-design-preview";
import { DCCurrencyMark } from "@/dc-ui/typography/DCCurrencyMark";

import {
  BentoCard,
  Chip,
  DotNumber,
  Legend,
  PreviewChip,
  TickBar,
  cx,
  smoothPath,
  useGrow,
  useTip,
  useTween,
  useWidth,
} from "./bento-kit";
import styles from "./market-bento.module.scss";
import {
  type ItemFigures,
  PERIOD_SUFFIX,
  type Period,
  type Quote,
  SINCE_LAUNCH,
  formatAmount,
  formatCompact,
  formatPrice,
  formatSignedPercent,
  priceSeries,
  sinceLaunch,
  toQuote,
} from "./market-model";

/*
 * Item market cards (ADR 0006). The item page uses `ItemPriceHero` and `TrenchesMarketCard`.
 * The other cards — curve
 * gauge, price change, curve reserve, fees, reputation, buys and sells, volume — are not on
 * the item page by owner decision and are kept for other routes.
 */

const SUPPLY_LEGEND = [
  { label: "Sold", tone: "toneSold" },
  { label: "On curve", tone: "toneCurve" },
  { label: "Reserved", tone: "toneReserved" },
] as const;

function QuoteMark({ quote }: { quote: Quote }) {
  return quote === "USDC" ? <DCCurrencyMark /> : <span>SOL</span>;
}

function quoteText(quote: Quote) {
  return quote === "USDC" ? "USDC" : "SOL";
}

/**
 * Top of the item page: item name, price, change and supply legend, with the item itself (3D model or
 * cover, passed as `children`) under the price.
 */
export function ItemPriceHero({
  title,
  titleId,
  figures,
  children,
}: {
  title: string;
  titleId: string;
  figures: ItemFigures;
  children: ReactNode;
}) {
  const quote: Quote = "USDC";
  const [ref, width] = useWidth<HTMLDivElement>();
  const last = figures.price;
  const since = sinceLaunch(figures);
  const shown = useTween(last === null ? 0 : toQuote(last, quote));

  return (
    <BentoCard label={title} tone="bare" className={styles.priceHero}>
      <div ref={ref} className={styles.row}>
        <h1 id={titleId} className={styles.heroTitle}>
          {title}
        </h1>
        <Legend items={SUPPLY_LEGEND} />
      </div>
      <div className={styles.figureRow}>
        <span className={styles.figure}>
          <DotNumber
            text={last === null ? "—" : formatPrice(shown)}
            label={
              last === null
                ? "Price: —"
                : `Price ${formatPrice(toQuote(last, quote))} ${quoteText(quote)}`
            }
            pitch={width && width < 420 ? 5.4 : 7}
          />
          <span className={styles.figureUnit}>
            <QuoteMark quote={quote} />
          </span>
        </span>
        <span className={styles.figureAside}>
          {since && (
            <span className={styles.delta}>
              {since.change >= 0 ? "↑" : "↓"} {Math.abs(since.change).toFixed(1)}%
            </span>
          )}
          {since && (
            <span className={styles.muted}>
              {since.amount >= 0 ? "+" : "−"}
              {formatPrice(Math.abs(toQuote(since.amount, quote)))} {quoteText(quote)}{" "}
              {SINCE_LAUNCH}
            </span>
          )}
          <PreviewChip show={figures.mode === "preview"} />
        </span>
      </div>
      <div className={styles.heroStage}>{children}</div>
    </BentoCard>
  );
}

/* ------------------------------- curve gauge ------------------------------- */

export function CurveGaugeCard({ figures }: { figures: ItemFigures }) {
  const supply = figures.supply;
  const total = supply ? supply.sold + supply.curve + supply.reserved : 0;
  const shares = supply
    ? { sold: supply.sold / total, curve: supply.curve / total, reserved: supply.reserved / total }
    : null;
  const sold = useTween((figures.progress ?? 0) * 100);
  const ticks = 56;
  const point = (radius: number, degrees: number) => [
    radius * Math.cos((degrees * Math.PI) / 180),
    radius * Math.sin((degrees * Math.PI) / 180),
  ];

  return (
    <BentoCard label="Bonding curve" tone="depth" className={styles.spanGauge}>
      <div className={styles.row}>
        <h3 className={styles.title}>Bonding curve</h3>
        <Chip quiet>Graduation 100%</Chip>
      </div>
      <svg className={styles.gauge} viewBox="-150 -150 300 168" aria-hidden="true">
        {Array.from({ length: ticks + 1 }, (_, index) => {
          const f = index / ticks;
          const angle = 180 + f * 180;
          const [x1, y1] = point(136, angle);
          const [x2, y2] = point(index % 7 === 0 ? 112 : 118, angle);
          const tone = !shares
            ? styles.tickIdle
            : f <= shares.sold
              ? styles.tickSold
              : f <= shares.sold + shares.curve
                ? styles.tickCurve
                : styles.tickReserved;
          return (
            <line
              key={f}
              x1={x1.toFixed(1)}
              y1={y1.toFixed(1)}
              x2={x2.toFixed(1)}
              y2={y2.toFixed(1)}
              className={cx(styles.gaugeTick, tone)}
              style={{ animationDelay: `${index * 12}ms` }}
            />
          );
        })}
        <text y={-22} textAnchor="middle" className={styles.gaugeValue}>
          {figures.progress === null ? "—" : Math.round(sold)}
          {figures.progress !== null && (
            <tspan dy={-24} className={styles.gaugeUnit}>
              %
            </tspan>
          )}
        </text>
        <text y={0} textAnchor="middle" className={styles.gaugeCaption}>
          sold
        </text>
      </svg>
      <p className={styles.srOnly}>
        {figures.progress === null
          ? "Curve progress: —"
          : `${Math.round(figures.progress * 100)}% of the curve sold`}
      </p>
      <div className={styles.gaugeRows}>
        {SUPPLY_LEGEND.map(({ label, tone }, index) => {
          const key = (["sold", "curve", "reserved"] as const)[index];
          return (
            <div key={label} className={styles.listRow}>
              <span className={cx(styles.dot, styles[tone])} aria-hidden="true" />
              <span className={styles.listName}>{label}</span>
              <span className={cx(styles.mono, styles.muted)}>
                {shares ? `${Math.round(shares[key] * 100)}%` : "—"}
              </span>
              <span className={cx(styles.mono, styles.listValue)}>
                {supply ? formatCompact(supply[key]) : "—"}
              </span>
            </div>
          );
        })}
      </div>
      <PreviewCorner show={figures.mode === "preview"} />
    </BentoCard>
  );
}

function PreviewCorner({ show }: { show: boolean }) {
  return show ? (
    <span className={styles.corner}>
      <Chip quiet>Preview</Chip>
    </span>
  ) : null;
}

/* ---------------------------------- KPIs ----------------------------------- */

export function ChangeCard({
  figures,
  period,
  quote,
}: { figures: ItemFigures; period: Period; quote: Quote }) {
  const series = figures.history ? priceSeries(figures.history, period) : null;
  const first = series?.[0].price ?? null;
  const last = series?.[series.length - 1].price ?? null;
  const change = first && last ? ((last - first) / first) * 100 : null;
  const shown = useTween(change ?? 0);
  const up = (change ?? 0) >= 0;
  return (
    <BentoCard label="Price change" tone="solid" className={styles.spanKpi}>
      <div className={styles.row}>
        <h3 className={styles.caption}>Price change</h3>
        <Chip>
          {first !== null && last !== null
            ? `${up ? "+" : "−"}${formatPrice(Math.abs(toQuote(last - first, quote)))}`
            : "—"}
        </Chip>
      </div>
      <div className={styles.kpiBig}>
        {change === null ? null : up ? (
          <ArrowUp aria-hidden="true" size={30} strokeWidth={2.4} />
        ) : (
          <ArrowDown aria-hidden="true" size={30} strokeWidth={2.4} />
        )}
        <span className={styles.big}>
          {change === null ? "—" : `${Math.abs(shown).toFixed(1)}%`}
        </span>
      </div>
      <p className={styles.kpiFoot}>
        Item price · {PERIOD_SUFFIX[period]}
        {figures.mode === "preview" ? " · Preview" : ""}
      </p>
    </BentoCard>
  );
}

export function ReserveCard({ figures, quote }: { figures: ItemFigures; quote: Quote }) {
  const reserve = useTween(
    figures.quoteReserve === null ? 0 : toQuote(figures.quoteReserve, quote),
  );
  const progress = figures.progress;
  return (
    <BentoCard label="Curve reserve" tone="glass" className={styles.spanKpi}>
      <div className={styles.row}>
        <h3 className={styles.caption}>Curve reserve</h3>
        <span className={styles.muted}>To graduation</span>
      </div>
      <div className={cx(styles.row, styles.kpiNumbers)}>
        <span className={styles.big}>
          {figures.quoteReserve === null ? "—" : formatCompact(reserve)}
          {figures.quoteReserve !== null && (
            <span className={styles.bigUnit}>
              <QuoteMark quote={quote} />
            </span>
          )}
        </span>
        <span className={styles.mono}>
          {progress === null ? "—" : Math.round(progress * 100)}
          <span className={styles.muted}> %</span>
        </span>
      </div>
      <div className={styles.kpiBottom}>
        <TickBar share={progress ?? 0} />
      </div>
      <PreviewCorner show={figures.mode === "preview"} />
    </BentoCard>
  );
}

export function FeesCard({ figures }: { figures: ItemFigures }) {
  const creator =
    figures.creatorFeeBps === null ? "—" : `${formatAmount(Number(figures.creatorFeeBps) / 100)}%`;
  const rows = [
    ["P", "Pump.fun", "—"],
    ["C", "Creator", creator],
    ["Q", "Pair", "USDC"],
  ] as const;
  return (
    <BentoCard label="Fees" tone="glass" className={styles.spanKpi}>
      <div className={styles.row}>
        <h3 className={styles.caption}>Fees</h3>
        <span className={cx(styles.mono, styles.muted)}>{creator}</span>
      </div>
      <div className={styles.list}>
        {rows.map(([letter, name, value]) => (
          <div key={name} className={styles.listRow}>
            <span className={styles.letter} aria-hidden="true">
              {letter}
            </span>
            <span className={styles.listName}>{name}</span>
            <span className={cx(styles.mono, styles.listValue)}>
              {value === "USDC" ? <DCCurrencyMark /> : value}
            </span>
          </div>
        ))}
      </div>
    </BentoCard>
  );
}

export function SeasonCard({ figures, quote }: { figures: ItemFigures; quote: Quote }) {
  const season = figures.preview?.season ?? null;
  const rows = [
    ["Trades", season?.trades[0] ?? null, season ? String(season.trades[1]) : "—"],
    [
      "Volume",
      season?.volume[0] ?? null,
      season ? `${formatCompact(toQuote(season.volume[1], quote))} ${quoteText(quote)}` : "—",
    ],
  ] as const;
  return (
    <BentoCard label="Reputation" tone="glass" className={styles.spanKpi}>
      <div className={styles.row}>
        <h3 className={styles.caption}>Reputation</h3>
        <span className={styles.muted}>Season</span>
      </div>
      {rows.map(([name, share, target], index) => (
        <div key={name} className={styles.goal}>
          <div className={styles.goalHead}>
            <span>{name}</span>
            <span className={styles.mono}>
              {share === null ? "—" : `${Math.round(share * 100)}%`}
              <span className={styles.muted}> of {target}</span>
            </span>
          </div>
          <TickBar share={share ?? 0} count={40} height={12} major={8} delay={300 + index * 150} />
        </div>
      ))}
      <PreviewCorner show={figures.mode === "preview"} />
    </BentoCard>
  );
}

/* ------------------------------ buys and sells ----------------------------- */

export function FlowCard({ figures, quote }: { figures: ItemFigures; quote: Quote }) {
  const tip = useTip();
  const [ref, width] = useWidth<HTMLDivElement>();
  const flow = figures.preview?.flow ?? null;
  const grow = useGrow(`${figures.mode}-${quote}`, 1200);
  const H = 230;
  const left = 44;
  const right = width - 36;
  const middle = H / 2;
  const label = 16;
  const amplitude = middle - label - 8;
  const max = 7;
  const months = PREVIEW_FLOW_MONTHS;
  const X = (index: number) => left + (index / (months.length - 1)) * (right - left);
  const path = (values: readonly number[], direction: 1 | -1) =>
    smoothPath(
      values.map((value, index): [number, number] => [
        X(index),
        middle + direction * (label + (value / max) * amplitude * grow),
      ]),
    );
  const net = flow
    ? flow.buys[0].reduce((sum, value, index) => sum + value - flow.sells[0][index], 0) /
      months.length
    : null;

  return (
    <BentoCard label="Buys and sells" tone="depth" className={styles.spanFlow}>
      <div className={styles.row}>
        <div>
          <h3 className={styles.title}>Buys and sells</h3>
          <p className={styles.muted}>
            Net{" "}
            <span className={cx(styles.mono, styles.accent)}>
              {net === null ? "—" : `+${formatCompact(toQuote(net * 1000, quote))}`}
            </span>{" "}
            {quoteText(quote)} a month
          </p>
        </div>
        <Legend
          column
          items={[
            { label: "Buys", tone: "toneSold" },
            { label: "Sells", tone: "toneSell" },
          ]}
        />
      </div>
      <div ref={ref} className={styles.flow}>
        {width > 0 && flow && (
          <svg
            width={width}
            height={H}
            viewBox={`0 0 ${width} ${H}`}
            aria-hidden="true"
            onPointerLeave={tip.hide}
            onPointerMove={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              const index = Math.max(
                0,
                Math.min(
                  months.length - 1,
                  Math.round(
                    ((event.clientX - rect.left - left) / (right - left)) * (months.length - 1),
                  ),
                ),
              );
              const buys = flow.buys[0][index] * 1000;
              const sells = flow.sells[0][index] * 1000;
              tip.show(
                rect.left + X(index),
                rect.top + middle - label - (flow.buys[0][index] / max) * amplitude,
                months[index],
                [
                  [
                    "Buys",
                    `${formatCompact(toQuote(buys, quote))} ${quoteText(quote)}`,
                    "toneSold",
                  ],
                  [
                    "Sells",
                    `${formatCompact(toQuote(sells, quote))} ${quoteText(quote)}`,
                    "toneSell",
                  ],
                  ["Net", `${formatCompact(toQuote(buys - sells, quote))} ${quoteText(quote)}`],
                ],
              );
            }}
          >
            {[0, 2, 4, 6].map((value) => {
              const yTop = middle - label - (value / max) * amplitude;
              const yBottom = middle + label + (value / max) * amplitude;
              const text = value ? `${value}K` : "0";
              return (
                <g key={value} className={styles.axis}>
                  <line x1={left} x2={right} y1={yTop} y2={yTop} />
                  <line x1={left} x2={right} y1={yBottom} y2={yBottom} />
                  <text x={left - 12} y={yTop + 3.5} textAnchor="end">
                    {text}
                  </text>
                  <text x={left - 12} y={yBottom + 3.5} textAnchor="end">
                    {text}
                  </text>
                </g>
              );
            })}
            {months.map((month, index) => (
              <text
                key={month}
                x={X(index)}
                y={middle + 4}
                textAnchor="middle"
                className={styles.flowMonth}
              >
                {month}
              </text>
            ))}
            {[2, 1, 0].map((season) => (
              <path
                key={`b${season}`}
                d={path(flow.buys[season], -1)}
                className={styles.flowBuy}
                style={{ strokeOpacity: [1, 0.55, 0.3][season], strokeWidth: season ? 1.6 : 2.4 }}
              />
            ))}
            {[2, 1, 0].map((season) => (
              <path
                key={`s${season}`}
                d={path(flow.sells[season], 1)}
                className={styles.flowSell}
                style={{ strokeOpacity: [1, 0.55, 0.3][season], strokeWidth: season ? 1.6 : 2.4 }}
              />
            ))}
          </svg>
        )}
        {!flow && <p className={styles.empty}>—</p>}
      </div>
      <PreviewCorner show={figures.mode === "preview"} />
    </BentoCard>
  );
}

/* ---------------------------------- volume --------------------------------- */

export function VolumeCard({ figures, quote }: { figures: ItemFigures; quote: Quote }) {
  const tip = useTip();
  const [ref, width] = useWidth<HTMLDivElement>();
  const values = figures.preview?.weeklyVolume ?? null;
  const total = values ? values.reduce((sum, value) => sum + value, 0) * 1000 : null;
  const shown = useTween(total === null ? 0 : toQuote(total, quote));
  const grow = useGrow(`${figures.mode}`, 800);
  const H = 160;
  const pad = 18;
  const bar = 22;
  const max = 5;
  const gap = values ? (width - 24 - bar * values.length) / (values.length - 1) : 0;
  const Y = (value: number) => (H - pad) * (1 - value / max);
  const change =
    values && values.length > 1
      ? ((values[values.length - 1] - values[0]) / values[0]) * 100
      : null;

  return (
    <BentoCard label="Volume" tone="depth" className={styles.spanVolume}>
      <h3 className={styles.title}>Volume</h3>
      <p className={styles.volumeFigure}>
        <span className={styles.big}>{total === null ? "—" : formatCompact(shown)}</span>
        {total !== null && (
          <span className={styles.bigUnit}>
            <QuoteMark quote={quote} />
          </span>
        )}
      </p>
      <p className={styles.row}>
        <span className={styles.delta}>{change === null ? "—" : formatSignedPercent(change)}</span>
        <span className={styles.muted}>this week</span>
      </p>
      <div ref={ref} className={styles.volume}>
        {width > 0 && values && (
          <svg width={width} height={H} aria-hidden="true" onPointerLeave={tip.hide}>
            {[0, 2, 4].map((tick) => (
              <text key={tick} x={0} y={Y(tick) + 3.5} className={styles.axisText}>
                {tick}K
              </text>
            ))}
            {values.map((value, index) => {
              const x = 24 + index * (bar + gap);
              const today = index === values.length - 1;
              const height = (H - pad - Y(value)) * grow;
              const day = PREVIEW_WEEK_DAYS[index];
              return (
                <g
                  key={day}
                  onPointerMove={(event) =>
                    tip.show(event.clientX, event.clientY, `${day} · trading volume`, [
                      [
                        "Buys",
                        `${formatCompact(toQuote(value * 640, quote))} ${quoteText(quote)}`,
                        "toneSold",
                      ],
                      [
                        "Sells",
                        `${formatCompact(toQuote(value * 360, quote))} ${quoteText(quote)}`,
                        "toneSell",
                      ],
                    ])
                  }
                >
                  <rect
                    x={x}
                    y={Y(max)}
                    width={bar}
                    height={H - pad - Y(max)}
                    rx={bar / 2}
                    className={styles.capsuleTrack}
                  />
                  <rect
                    x={x}
                    y={H - pad - height}
                    width={bar}
                    height={height}
                    rx={bar / 2}
                    className={today ? styles.capsuleToday : styles.capsule}
                  />
                  <text
                    x={x + bar / 2}
                    y={H - 3}
                    textAnchor="middle"
                    className={today ? styles.dayToday : styles.axisText}
                  >
                    {day}
                  </text>
                  <rect x={x - 4} y={0} width={bar + 8} height={H} fill="transparent" />
                </g>
              );
            })}
          </svg>
        )}
        {!values && <p className={styles.empty}>—</p>}
      </div>
      <PreviewCorner show={figures.mode === "preview"} />
    </BentoCard>
  );
}
