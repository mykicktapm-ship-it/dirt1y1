import Link from "next/link";

import { DCCurrencyText } from "@/dc-ui/typography/DCCurrencyMark";

import styles from "./asset-card.module.scss";

/**
 * Trade-history card:
 * a tinted left panel with the change and price, the item image filling the right panel. The
 * whole card links to the item page (its name is the link label).
 * No hover scale (not part of the identity) and no leverage (Pump.fun trades are spot).
 */
export function AssetCard({
  id,
  name,
  change,
  price,
}: {
  id: string;
  name: string;
  /** Percent change over the period, e.g. 24.3; `null` when there is no price history yet. */
  change: number | null;
  /** Price in USDC, already formatted. */
  price: string;
}) {
  const positive = change === null ? undefined : change >= 0;
  return (
    <Link
      href={`/market/${id}/`}
      prefetch={false}
      className={styles.card}
      data-positive={positive}
      aria-label={`${name} trade history`}
    >
      <div className={styles.left}>
        <div>
          <p className={styles.change}>
            {change === null ? "—" : `${positive ? "+" : "−"}${Math.abs(change).toFixed(2)}%`}
          </p>
          <p className={styles.price}>
            <DCCurrencyText value={`${price} USDC`} />
          </p>
        </div>
      </div>
      <div className={styles.right}>
        <img src={`/marketplace/${id}/cover.webp`} alt="" width={556} height={384} loading="lazy" />
      </div>
    </Link>
  );
}
