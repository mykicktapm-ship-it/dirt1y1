"use client";

import type { CSSProperties } from "react";
import styles from "./site-entrance.module.scss";

export function DCBrandPreloader({ durationMs = 1500 }: { durationMs?: number }) {
  return (
    <div
      className={`${styles.brand} ${durationMs === 450 ? styles.brandTransition : ""}`}
      data-brand-preloader="true"
      data-brand-duration={durationMs}
      style={{ "--dc-brand-duration": `${durationMs}ms` } as CSSProperties}
      aria-busy="true"
    >
      <output className="sr-only">Preparing Dirtycoin.</output>
      <div className={styles.brandLogo} aria-hidden="true">
        <img
          className={styles.brandImage}
          src="/images/dirtycoin-logo.png"
          alt=""
          width={640}
          height={640}
          fetchPriority="high"
          decoding="async"
        />
        <div className={styles.brandFoil}>
          <div className={styles.brandSweep} />
        </div>
      </div>
    </div>
  );
}
