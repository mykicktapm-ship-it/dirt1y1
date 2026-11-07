import { Fragment, type HTMLAttributes } from "react";
import styles from "./currency-mark.module.scss";

/** Display alias only. Never changes mint identity, precision or calculations. */
export function currencyDisplayText(value: string): string {
  return value.replace(/\bDC\b/g, "USDC");
}

/** Shared lowercase lettering. Numbers retain their surrounding font. */
export function DCCurrencyMark({
  className,
  ...props
}: Omit<HTMLAttributes<HTMLSpanElement>, "children">) {
  return (
    <span
      className={`${styles.symbol}${className ? ` ${className}` : ""}`}
      aria-label="USDC"
      data-currency="USDC"
      {...props}
    >
      usdc
    </span>
  );
}

/** Keep numbers in the surrounding font and render only the currency mark. */
export function DCCurrencyText({ value }: { value: string }) {
  const occurrences = new Map<string, number>();
  return currencyDisplayText(value)
    .split(/\b(USDC)\b/g)
    .map((part) => {
      const occurrence = (occurrences.get(part) ?? 0) + 1;
      occurrences.set(part, occurrence);
      const key = `${part}-${occurrence}`;
      return part === "USDC" ? <DCCurrencyMark key={key} /> : <Fragment key={key}>{part}</Fragment>;
    });
}
