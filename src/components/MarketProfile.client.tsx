"use client";

import { useReducedMotion } from "framer-motion";
import { Rotate3d } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { SkeletonImage } from "@/dc-ui/feedback/DCSkeletonImage";
import { type DCItemMarketsLoad, selectItemMarket } from "@/hooks/useItemMarket";
import { useMarketSnapshot } from "@/hooks/useMarketSnapshot";
import { marketplaceItems } from "@/resources/marketplace";
import { formatPrice, itemFigures, sinceLaunch } from "./market-bento/market-model";
import styles from "./market-profile.module.scss";
import { AssetCard } from "./ui/asset-card";
import StatsWidget from "./ui/stats-widget";

const logo = "/images/dirtycoin-logo.jpg";

function ShimmerAvatar() {
  const id = useId();
  const mask = `${id}-profile-mask`;
  const shine = `${id}-profile-shine`;
  const root = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [ready, setReady] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    if (observer) observer.observe(element);
    else setVisible(true);
    const onVisibility = () => setHidden(document.hidden);
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div
      ref={root}
      className={styles.avatar}
      data-ready={ready}
      data-shimmer={ready && visible && !hidden && reduced === false}
    >
      <SkeletonImage
        src={logo}
        width={104}
        height={104}
        alt="Dirtycoin logo"
        shape="circle"
        loading="eager"
        decoding="async"
        onLoad={() => setReady(true)}
      />
      <svg className={styles.avatarFoil} viewBox="0 0 640 640" aria-hidden="true">
        <defs>
          <mask
            id={mask}
            x="0"
            y="0"
            width="640"
            height="640"
            maskUnits="userSpaceOnUse"
            style={{ maskType: "luminance" }}
          >
            <image
              href={ready ? logo : undefined}
              width="640"
              height="640"
              style={{ filter: "contrast(1.3)" }}
            />
          </mask>
          <linearGradient id={shine} x1="0" x2="1" y1="0" y2="0.25">
            <stop offset="0.3" stopColor="white" stopOpacity="0" />
            <stop offset="0.5" stopColor="white" stopOpacity="0.9" />
            <stop offset="0.7" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g mask={`url(#${mask})`}>
          <rect className={styles.avatarSweep} width="640" height="640" fill={`url(#${shine})`} />
        </g>
      </svg>
    </div>
  );
}

const compactUsd = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 1,
  notation: "compact",
  style: "currency",
});

export function MarketProfile({ markets }: { markets: DCItemMarketsLoad }) {
  const { snapshot, status } = useMarketSnapshot();
  const marketCap = status === "ready" && snapshot ? Number(snapshot.marketCapUsd) : null;
  const disclosure = snapshot
    ? `Birdeye market-cap estimate · snapshot ${snapshot.generatedAt}`
    : undefined;
  const cards = marketplaceItems.flatMap((item) => {
    const figures = itemFigures(item.id, selectItemMarket(markets, item.id));
    if (figures.price === null) return [];
    return [
      {
        id: item.id,
        name: item.title,
        change: sinceLaunch(figures)?.change ?? null,
        price: formatPrice(figures.price),
      },
    ];
  });

  return (
    <section className={styles.profile} aria-label="Market profile">
      <h1 className="sr-only">Market</h1>
      <div className={styles.topRow}>
        <ShimmerAvatar />
        <section className={styles.deposits} aria-label={disclosure} title={disclosure}>
          <StatsWidget
            label="Market cap"
            value={
              marketCap !== null && Number.isFinite(marketCap) ? compactUsd.format(marketCap) : "—"
            }
          />
        </section>
      </div>
      <MarketGuide />
      <h2 className={styles.historyLabel}>Trade history</h2>
      <div className={styles.highlights} aria-label="Trade history">
        {cards.map((card) => (
          <AssetCard key={card.id} {...card} />
        ))}
      </div>
    </section>
  );
}

/** How to inspect an item; shown in the profile block. */
export function MarketGuide() {
  return (
    <div className={styles.exposition}>
      <Rotate3d size={28} strokeWidth={1.5} aria-hidden="true" />
      <div>
        <h2>Hover to preview</h2>
        <p>Press and hold an item image to inspect it in 3D.</p>
      </div>
    </div>
  );
}
