"use client";

import Link from "next/link";
import { useState } from "react";

import { DCDashboardPanel } from "@/dc-ui/cards/DCMarketDashboardCard";
import { DCCurrencyText } from "@/dc-ui/typography/DCCurrencyMark";
import { useItemHoldings } from "@/hooks/useItemHoldings";
import { selectItemMarket, useItemMarkets } from "@/hooks/useItemMarket";
import { marketplaceItems } from "@/resources/marketplace";
import { MarketProfile } from "./MarketProfile.client";
import {
  formatChange,
  formatCompact,
  formatPrice,
  holdingValue,
  itemFigures,
  sinceLaunch,
} from "./market-bento/market-model";
import styles from "./marketplace-overview.module.scss";
import { Badge } from "./ui/badge";
import { GlassButton } from "./ui/glass-button";
import GlassCard from "./ui/glass-card";
import cardStyles from "./ui/glass-card.module.scss";
import { SkeletonImage } from "./ui/skeleton-image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

/** Item coins use 6 decimals. */
const UNIT = 1_000_000;

export default function MarketplaceCards() {
  const markets = useItemMarkets();
  const holdings = useItemHoldings();
  const [filter, setFilter] = useState("all");
  const rows = marketplaceItems.map((item) => {
    const figures = itemFigures(item.id, selectItemMarket(markets, item.id));
    const amount = holdings?.[item.id] ?? 0n;
    return { item, figures, amount, value: holdingValue(figures, amount) };
  });
  const held = rows.filter((row) => row.amount > 0n);
  const visible = filter === "all" ? rows : held;

  return (
    <div className={styles.market}>
      <MarketProfile markets={markets} />

      <Tabs value={filter} onValueChange={setFilter}>
        <div className={styles.catalogueBar}>
          <TabsList
            className="rounded-full **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:bg-muted-foreground/30 [&_button]:gap-1.5"
            aria-label="Market view"
          >
            <TabsTrigger value="all" className="rounded-full">
              All items <Badge variant="secondary">{rows.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="positions" className="rounded-full">
              My positions <Badge variant="secondary">{held.length}</Badge>
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value={filter} className={styles.catalogue}>
          {visible.length ? (
            <div className={`${cardStyles.grid} ${styles.catalogueGrid}`}>
              {visible.map(({ item, figures }) => {
                const price = figures.price === null ? "—" : `${formatPrice(figures.price)} USDC`;
                const change = sinceLaunch(figures)?.change ?? null;
                return (
                  <GlassCard
                    key={item.id}
                    assetId={item.id}
                    title={item.title}
                    openHref={`/market/${item.id}/`}
                    price={price}
                    change={change === null ? undefined : formatChange(change)}
                  />
                );
              })}
            </div>
          ) : (
            <div className={styles.empty}>
              <h2>No items yet</h2>
              <p>Buy an item on Pump.fun. It will show up here.</p>
              <GlassButton size="sm" onClick={() => setFilter("all")}>
                Explore items
              </GlassButton>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {held.length > 0 && (
        <DCDashboardPanel label="Your market positions" className={styles.section}>
          <div className={styles.sectionHeading}>
            <h2>Your positions</h2>
            <span>Before fees</span>
          </div>
          <ul className={styles.rows}>
            {held.map(({ item, amount, value }) => (
              <li key={item.id}>
                <Link href={`/market/${item.id}/`} prefetch={false} className={styles.row}>
                  <SkeletonImage
                    src={`/marketplace/${item.id}/cover.webp`}
                    width={40}
                    height={40}
                    alt=""
                    className={styles.itemImage}
                  />
                  <div className={styles.rowIdentity}>
                    <strong>{item.title}</strong>
                    <span>{formatCompact(Number(amount) / UNIT)}</span>
                  </div>
                  <div className={styles.rowValue}>
                    <strong>
                      {value === null ? (
                        "—"
                      ) : (
                        <DCCurrencyText value={`${formatPrice(value)} USDC`} />
                      )}
                    </strong>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </DCDashboardPanel>
      )}
    </div>
  );
}
