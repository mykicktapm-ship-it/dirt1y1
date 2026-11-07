"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { ItemPriceHero } from "@/components/market-bento/ItemMarketBento.client";
import { TradeEstimator } from "@/components/market-bento/TradeEstimator.client";
import { TrenchesMarketCard } from "@/components/market-bento/TrenchesMarketCard.client";
import { itemFigures } from "@/components/market-bento/market-model";
import { SkeletonImage } from "@/components/ui/skeleton-image";
import { type DCItemMarketLoad, describeItemMarket } from "@/dc-chain/item-market-view";
import { useDCLoadingPhase } from "@/dc-ui/feedback/DCLoadingContext";
import { selectItemMarket, useItemMarkets } from "@/hooks/useItemMarket";
import type { MarketplaceItemId } from "@/resources/launch";
import { marketplaceItems } from "@/resources/marketplace";
import { getMarketplaceCoverStyle } from "@/resources/marketplace-cover-framing";

import styles from "./item-market-page.module.scss";

type StatusTone = "loading" | "idle" | "live" | "unavailable";

function statusTone(load: DCItemMarketLoad): StatusTone {
  if (load.state === "loading") return "loading";
  if (load.state === "error") return "unavailable";
  switch (load.market.status) {
    case "not-launched":
      return "idle";
    case "curve":
    case "graduated":
      return "live";
    default:
      return "unavailable";
  }
}

/** Price with the item itself at the top, then name and the trade estimate, then the other items. */
export function ItemMarketPage({ itemId }: { itemId: MarketplaceItemId }) {
  const item = marketplaceItems.find((entry) => entry.id === itemId) ?? marketplaceItems[0];
  const markets = useItemMarkets();
  const load = selectItemMarket(markets, itemId);
  const view = describeItemMarket(load);
  const figures = itemFigures(item.id, load);
  const titleId = useId();

  return (
    <article className={styles.scene} aria-labelledby={titleId}>
      <Link href="/market/" prefetch={false} className={styles.back}>
        <ArrowLeft size={15} aria-hidden="true" /> Marketplace
      </Link>

      <div className={styles.hero}>
        <ItemPriceHero title={item.title} titleId={titleId} figures={figures}>
          <ItemStage assetId={item.id} title={item.title} />
        </ItemPriceHero>
      </div>

      <div className={styles.copy}>
        <p className={styles.status} data-tone={statusTone(load)} aria-live="polite">
          <span className={styles.statusDot} aria-hidden="true" />
          {view.status}
        </p>
        <TradeEstimator title={item.title} figures={figures} />
      </div>

      <TrenchesMarketCard current={item.id} markets={markets} bare className={styles.market} />
    </article>
  );
}

/**
 * Cover first (same framing as the catalogue card, so the card visibly continues into the
 * page), then the full-quality 3D turntable fades in over it. The viewer stops itself on a
 * hidden tab and under reduced motion; off-screen it is paused from here.
 */
function ItemStage({ assetId, title }: { assetId: string; title: string }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const loadingPhase = useDCLoadingPhase();
  const [visible, setVisible] = useState(false);
  const [requested, setRequested] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || loadingPhase === "brand") return;
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } })
      .connection;
    if (!connection?.saveData) setRequested(true);
  }, [visible, loadingPhase]);

  useEffect(() => {
    function receive(event: MessageEvent) {
      if (
        event.origin !== window.location.origin ||
        event.source !== frameRef.current?.contentWindow
      )
        return;
      if (event.data?.type === "model-ready") setReady(true);
      if (event.data?.type === "model-error") setFailed(true);
    }
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, []);

  useEffect(() => {
    if (!ready) return;
    frameRef.current?.contentWindow?.postMessage(
      { type: "model-motion", paused: !visible },
      window.location.origin,
    );
  }, [ready, visible]);

  const showModel = ready && !failed;

  return (
    <div ref={stageRef} className={styles.stage}>
      <SkeletonImage
        src={`/marketplace/${assetId}/cover.webp`}
        loading="eager"
        alt={title}
        width={556}
        height={384}
        className={styles.poster}
        shape="rounded"
        style={{ ...getMarketplaceCoverStyle(assetId), opacity: showModel ? 0 : 1 }}
      />
      {requested && !failed && (
        <iframe
          ref={frameRef}
          title={`${title} — rotating 3D preview`}
          src={`/marketplace/viewer/index.html?asset=${assetId}`}
          className={styles.viewer}
          style={{ opacity: showModel ? 1 : 0 }}
          tabIndex={-1}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
