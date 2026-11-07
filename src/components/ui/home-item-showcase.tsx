"use client";

import {
  formatChange,
  formatCompact,
  formatPrice,
  itemFigures,
  sinceLaunch,
} from "@/components/market-bento/market-model";
import { DCCurrencyText } from "@/dc-ui/typography/DCCurrencyMark";
import { selectItemMarket, useItemMarkets } from "@/hooks/useItemMarket";
import { marketplaceItems } from "@/resources/marketplace";
import { ShoppingCart } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { DirtycoinParallaxCard } from "./dirtycoin-parallax-card";
import { GlassButton } from "./glass-button";
import GlassCard from "./glass-card";
import styles from "./home-item-showcase.module.scss";
import { SkeletonImage } from "./skeleton-image";
import StatsWidget from "./stats-widget";
import { useCartCountdown } from "./use-cart-countdown";

type Item = (typeof marketplaceItems)[number];
const defaultItemId = marketplaceItems[0].id;
const artworkItemId = "bulletproof-umbrella";
const cartStorageKey = "dirtycoin.cart-items";
const reveal = (fx: string, delay: number) => ({ "data-sc": 1, "data-fx": fx, "data-d": delay });
const hidden = { opacity: 0 };

export default function HomeItemShowcase({
  active,
  artworkReady = false,
}: {
  active: boolean;
  artworkReady?: boolean;
}) {
  const [selected, setSelected] = useState<Item["id"]>(defaultItemId);
  const [cartItems, setCartItems] = useState<string[]>([]);
  const compositionRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const cartRef = useRef<HTMLButtonElement>(null);
  const sideRef = useRef<HTMLDivElement>(null);
  const preparedRef = useRef(false);
  const selectedItem = marketplaceItems.find((item) => item.id === selected) ?? marketplaceItems[0];
  const isInCart = cartItems.includes(selectedItem.id);
  const countdown = useCartCountdown();
  const markets = useItemMarkets();
  const figures = itemFigures(selectedItem.id, selectItemMarket(markets, selectedItem.id));
  const priceLabel = figures.price === null ? "—" : `${formatPrice(figures.price)} USDC`;
  const change = sinceLaunch(figures)?.change ?? null;
  // The Trenches Market cap appears once an item trades; before that the slot keeps its copy.
  const liveCaps = marketplaceItems
    .map((item) => itemFigures(item.id, selectItemMarket(markets, item.id)))
    .filter((entry) => entry.mode === "live" && entry.marketCap !== null);
  const trenchesCap = liveCaps.length
    ? liveCaps.reduce((sum, entry) => sum + (entry.marketCap ?? 0), 0)
    : null;

  useLayoutEffect(() => {
    if (!active && !preparedRef.current) return;
    preparedRef.current = true;
    const composition = compositionRef.current;
    const bottom = bottomRef.current;
    const preview = previewRef.current;
    const cart = cartRef.current;
    const side = sideRef.current;
    const stage = preview?.closest<HTMLElement>(".hs-stage");
    if (!composition || !bottom || !preview || !cart || !side || !stage) return;
    let offset = 0;
    const layoutTop = (element: HTMLElement) => {
      let top = 0;
      for (let node: HTMLElement | null = element; node && node !== composition; ) {
        top += node.offsetTop;
        node = node.offsetParent as HTMLElement | null;
      }
      return top;
    };
    const align = () => {
      if (composition.clientWidth > 720 || cart.offsetWidth === 0) {
        preview.style.removeProperty("--preview-offset-y");
        offset = 0;
        return;
      }
      const cartBottom = layoutTop(cart) + cart.offsetHeight;
      const cardBottom = layoutTop(preview) + preview.offsetHeight;
      const next = cartBottom - cardBottom + offset;
      if (Math.abs(next - offset) > 0.5) {
        offset = next;
        preview.style.setProperty("--preview-offset-y", `${next}px`);
      }
    };
    let stageRetries = 0;
    let retryFrame = 0;
    const fit = () => {
      const width = stage.clientWidth;
      const height = stage.clientHeight;
      if (!width || !height) {
        // A client-side return can mount before the stage is laid out; retry the next frames
        // instead of leaving the composition unscaled.
        if (stageRetries < 10) {
          stageRetries += 1;
          retryFrame = requestAnimationFrame(fit);
        }
        return;
      }
      stageRetries = 0;
      const hasSpace = (candidate: number) => {
        composition.style.height = `${candidate}px`;
        align();
        const galleryBottom = layoutTop(bottom) + bottom.offsetHeight;
        if (composition.clientWidth <= 720) {
          // Mobile stacks the gallery, then the banner, then the item block.
          const contentTop = Math.min(layoutTop(preview), layoutTop(side));
          const contentBottom = Math.max(
            layoutTop(preview) + preview.offsetHeight,
            layoutTop(side) + side.offsetHeight,
          );
          return (
            layoutTop(bottom) >= 8 &&
            galleryBottom + 20 <= contentTop &&
            contentBottom <= candidate - 8
          );
        }
        const upperBottom = Math.max(
          layoutTop(cart) + cart.offsetHeight,
          layoutTop(preview) + preview.offsetHeight,
        );
        return layoutTop(bottom) - upperBottom >= 20 && galleryBottom <= candidate - 8;
      };
      let designHeight = height;
      if (!hasSpace(height)) {
        let lower = height;
        let upper = height;
        // Find the smallest layout that fits, rather than jumping to a fixed tall canvas.
        for (let attempt = 0; attempt < 8; attempt++) {
          upper += Math.max(32, upper * 0.15);
          if (hasSpace(upper)) break;
          lower = upper;
        }
        for (let attempt = 0; attempt < 8 && upper - lower > 1; attempt++) {
          const candidate = (lower + upper) / 2;
          if (hasSpace(candidate)) upper = candidate;
          else lower = candidate;
        }
        designHeight = Math.ceil(upper);
        hasSpace(designHeight);
      }
      composition.style.setProperty(
        "--composition-scale",
        String(Math.min(1, height / designHeight)),
      );
    };
    const observer = new ResizeObserver(fit);
    observer.observe(stage);
    observer.observe(side);
    observer.observe(cart);
    observer.observe(preview);
    observer.observe(bottom);
    fit();
    return () => {
      cancelAnimationFrame(retryFrame);
      observer.disconnect();
      preview.style.removeProperty("--preview-offset-y");
      composition.style.removeProperty("height");
      composition.style.removeProperty("--composition-scale");
    };
  }, [active]);

  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(cartStorageKey) ?? "[]");
      if (Array.isArray(saved)) {
        setCartItems(
          saved.filter(
            (id): id is string =>
              typeof id === "string" && marketplaceItems.some((item) => item.id === id),
          ),
        );
      }
    } catch {
      // Storage can be unavailable; the cart still works in this session.
    }
  }, []);

  const addToCart = () => {
    const next = [...new Set([...cartItems, selectedItem.id])];
    setCartItems(next);
    try {
      localStorage.setItem(cartStorageKey, JSON.stringify(next));
    } catch {
      // Preserve the in-memory cart when persistent storage is unavailable.
    }
  };

  useEffect(() => {
    if (!active) setSelected(defaultItemId);
  }, [active]);

  return (
    <div ref={compositionRef} className={styles.composition}>
      <GlassCard
        ref={previewRef}
        {...reveal("fade", 0.05)}
        className={styles.preview}
        assetId={selectedItem.id}
        title={selectedItem.title}
        openHref={`/market/${selectedItem.id}/`}
        price={priceLabel}
        change={change === null ? undefined : formatChange(change)}
        active={active}
        style={{ ...hidden, pointerEvents: active ? "auto" : "none" }}
      />
      <div className={styles.interfaceLayer}>
        <div className={styles.layoutFrame}>
          <div ref={sideRef} className={`${styles.side} ${styles.right}`}>
            <div
              {...reveal("clip", 0.1)}
              className={styles.group}
              style={{ ...hidden, fontSize: "calc(min(6.2cqw, 5.4cqh) * 1.15)", lineHeight: 1.1 }}
            >
              <span className={styles.label}>MARKET</span>
              {["Earn in", "the Trenches", "Market"].map((row) => (
                <div key={row} className={styles.row}>
                  {row}
                </div>
              ))}
            </div>
            <div
              {...reveal("clip", 0.15)}
              className={`${styles.group} ${styles.payoutGroup}`}
              style={hidden}
            >
              <span className={styles.label}>MARKET CAP</span>
              <StatsWidget
                active={active}
                label="Trenches Market cap"
                value={
                  trenchesCap === null ? (
                    "—"
                  ) : (
                    <DCCurrencyText value={`${formatCompact(trenchesCap)} USDC`} />
                  )
                }
                caption={trenchesCap === null ? "Not launched yet" : undefined}
                chartLabel="Trenches Market cap, last 24 hours"
              />
              <GlassButton
                ref={cartRef}
                type="button"
                className={styles.cartButton}
                size="sm"
                contentClassName="flex items-center gap-0"
                disabled={isInCart}
                aria-label={
                  isInCart
                    ? `${selectedItem.title} added to cart${countdown ? `, ${countdown.label} left` : ""}`
                    : `Add ${selectedItem.title} to cart${countdown ? `, ${countdown.label} left` : ""}`
                }
                onClick={addToCart}
              >
                <span className={styles.cartIcon}>
                  <ShoppingCart size={16} aria-hidden="true" strokeWidth={2} />
                </span>
                {countdown && (
                  <span className={styles.cartTimer} aria-hidden="true">
                    {countdown.label}
                  </span>
                )}
              </GlassButton>
            </div>
          </div>
        </div>
        <section ref={bottomRef} className={styles.bottomSection} aria-label="Market items">
          <div
            {...reveal("clip", 0.1)}
            className={`${styles.group} ${styles.riskNotice}`}
            style={hidden}
          >
            <h2 className={styles.riskHeading}>
              <DCCurrencyText value="Spend USDC in the Trenches Market" />
            </h2>
            <p className={styles.disclaimer}>
              These are high-risk assets. By investing, you may lose your funds.
            </p>
          </div>
          <fieldset
            {...reveal("rise", 0.6)}
            className={styles.gallery}
            aria-label="Choose an item"
            style={hidden}
          >
            {marketplaceItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={styles.miniature}
                data-home-item={item.id}
                aria-label={item.title}
                aria-pressed={selected === item.id}
                title={item.title}
                onClick={() => setSelected(item.id)}
              >
                <span
                  className={styles.miniatureMedia}
                  data-umbrella-gallery-anchor={item.id === artworkItemId ? "" : undefined}
                >
                  <SkeletonImage
                    src={`/marketplace/${item.id}/cover.webp`}
                    enabled={active}
                    alt=""
                    width={556}
                    height={384}
                    style={{
                      opacity: item.id === artworkItemId && active && artworkReady ? 0 : 1,
                    }}
                  />
                </span>
                <span className={styles.miniatureTitle} aria-hidden="true">
                  {item.title}
                </span>
              </button>
            ))}
          </fieldset>
          <div {...reveal("fade", 0.35)} className={styles.mobileBanner} style={hidden}>
            <DirtycoinParallaxCard
              description="Connect and sign a message to buy, bid, or open your P2P dashboards. The Market is open soon!"
              price={countdown?.label ?? "—"}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
