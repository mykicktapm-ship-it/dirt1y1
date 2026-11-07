"use client";

import { ArrowUpRight } from "lucide-react";
import { useId, useMemo, useState } from "react";

import { quotePumpCurveBuy, quotePumpCurveSell } from "@/dc-chain/pump-curve";
import { DCCurrencyMark } from "@/dc-ui/typography/DCCurrencyMark";
import { getPumpCoinUrl } from "@/resources/launch";

import { Chip, Segmented, cx } from "./bento-kit";
import styles from "./market-bento.module.scss";
import { type ItemFigures, formatCompact, formatPrice } from "./market-model";

const DECIMALS = 6;
const UNIT = 10n ** BigInt(DECIMALS);

/** "12.5" → 12_500_000n; null when not a plain decimal with at most 6 fraction digits. */
function parseUnits(input: string): bigint | null {
  const value = input.trim().replace(/,/g, "");
  if (!/^\d+(\.\d{0,6})?$/.test(value)) return null;
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * UNIT + BigInt(fraction.padEnd(DECIMALS, "0"));
}

function units(value: bigint): number {
  return Number(value) / Number(UNIT);
}

/**
 * The curve mechanic in the interface: an estimate from the on-chain reserves (or labelled
 * preview reserves) using the constant-product math in DC Chain, then a link to Pump.fun,
 * where the trade is made. Nothing here builds or signs a transaction.
 */
export function TradeEstimator({ title, figures }: { title: string; figures: ItemFigures }) {
  const [side, setSide] = useState<"Buy" | "Sell">("Buy");
  const [input, setInput] = useState("100");
  const inputId = useId();
  const curve = figures.curve;
  const amount = parseUnits(input);

  const estimate = useMemo(() => {
    if (!curve || amount === null || amount === 0n || figures.price === null) return null;
    if (side === "Buy") {
      const tokens = quotePumpCurveBuy(curve, amount);
      if (tokens === 0n) return null;
      const average = units(amount) / units(tokens);
      return { out: units(tokens), impact: (average / figures.price - 1) * 100 };
    }
    const quote = quotePumpCurveSell(curve, amount);
    if (quote === 0n) return null;
    const average = units(quote) / units(amount);
    return { out: units(quote), impact: (1 - average / figures.price) * 100 };
  }, [amount, curve, figures.price, side]);

  const error = input !== "" && amount === null ? "Use a number with up to 6 decimals." : null;

  return (
    <section className={styles.trade} aria-label={`Estimate a ${title} trade`}>
      <div className={styles.row}>
        <Segmented
          label="Side"
          options={["Buy", "Sell"] as const}
          value={side}
          onChange={(next) => {
            setSide(next);
            setInput(next === "Buy" ? "100" : "100000");
          }}
        />
        {figures.mode === "preview" && <Chip quiet>Preview</Chip>}
      </div>

      <label htmlFor={inputId} className={styles.tradeLabel}>
        {side === "Buy" ? "You pay" : "You sell"}
      </label>
      <div className={styles.tradeInput}>
        <input
          id={inputId}
          inputMode="decimal"
          autoComplete="off"
          value={input}
          maxLength={24}
          onChange={(event) => setInput(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={`${inputId}-out`}
          disabled={!curve}
        />
        <span>{side === "Buy" ? <DCCurrencyMark /> : title}</span>
      </div>

      <dl id={`${inputId}-out`} className={styles.tradeOut} aria-live="polite">
        <div>
          <dt>You get about</dt>
          <dd className={styles.mono}>
            {error ??
              (estimate
                ? side === "Buy"
                  ? formatCompact(estimate.out)
                  : formatPrice(estimate.out)
                : "—")}
            {estimate && !error && (
              <span className={styles.muted}> {side === "Buy" ? title : <DCCurrencyMark />}</span>
            )}
          </dd>
        </div>
        <div>
          <dt>Price impact</dt>
          <dd className={styles.mono}>{estimate ? `${estimate.impact.toFixed(2)}%` : "—"}</dd>
        </div>
      </dl>
      <p className={styles.tradeNote}>Curve estimate before fees. Trades happen on Pump.fun.</p>

      {figures.mint ? (
        <a
          className={styles.tradeAction}
          href={getPumpCoinUrl(figures.mint)}
          target="_blank"
          rel="noopener noreferrer"
        >
          {side} on Pump.fun <ArrowUpRight size={16} aria-hidden="true" />
        </a>
      ) : (
        <button type="button" className={cx(styles.tradeAction)} disabled>
          {side} on Pump.fun <ArrowUpRight size={16} aria-hidden="true" />
        </button>
      )}
    </section>
  );
}
