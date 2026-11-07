"use client";

import { useState } from "react";

import { marketplaceItems } from "@/resources/marketplace";

import styles from "./inventory.module.scss";

/**
 * Inventory preview as the Dashboard's stage (where the item page shows its 3D item): every
 * catalogue item as a tile. Selected items are in colour, available ones in grayscale; a click
 * or keyboard press moves an item between the two. Local UI state only: not an ownership
 * query, resets on remount, no signatures.
 */
export function Inventory() {
  const [selected, setSelected] = useState<ReadonlySet<string>>(
    () => new Set(marketplaceItems.slice(0, 3).map((item) => item.id)),
  );

  const toggle = (id: string) =>
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <section aria-labelledby="inventory-title" className={styles.inventory}>
      <div className={styles.head}>
        <h2 id="inventory-title" className={styles.title}>
          Inventory
        </h2>
        <span className={styles.preview}>Preview</span>
        <span className={styles.count}>
          {selected.size}/{marketplaceItems.length}
        </span>
      </div>
      <ul className={styles.grid}>
        {marketplaceItems.map((item) => {
          const active = selected.has(item.id);
          return (
            <li key={item.id}>
              <button
                type="button"
                className={styles.tile}
                data-active={active}
                aria-pressed={active}
                aria-label={`${item.title}: ${active ? "Selected" : "Available"}`}
                onClick={() => toggle(item.id)}
              >
                <img
                  src={`/marketplace/${item.id}/cover.webp`}
                  alt=""
                  width={556}
                  height={384}
                  loading="lazy"
                  decoding="async"
                />
                <span className={styles.name}>{item.title}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
