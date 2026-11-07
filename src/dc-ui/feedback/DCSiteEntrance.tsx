"use client";

import { usePathname } from "next/navigation";
import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { marketplaceItems } from "@/resources/marketplace";
import { getMarketplaceCoverStyle } from "@/resources/marketplace-cover-framing";
import { marketplaceSkeletonMasks } from "@/resources/marketplace-skeletons";
import { DCBrandPreloader } from "./DCBrandPreloader";
import { DCDashboardSkeleton, type DCDashboardSkeletonProps } from "./DCDashboardSkeleton";
import { DCLoadingContext, type DCLoadingPhase } from "./DCLoadingContext";
import { runEntrancePreload } from "./entrance-preload";

import styles from "./site-entrance.module.scss";

type EntranceStatus = "pending" | "ready" | "timeout";

export interface DCSiteEntranceProps {
  afterReady?: ReactNode;
  children: ReactNode;
  dashboardFeed?: DCDashboardSkeletonProps;
  mode?: "site" | "page";
  onReady?: () => void;
}

function maskStyle(mask: string): CSSProperties {
  return { maskImage: `url("${mask}")`, WebkitMaskImage: `url("${mask}")` };
}

function CommunitySkeleton({ article }: { article: boolean }) {
  return article ? (
    <div className={styles.communityArticle}>
      <div className={`${styles.shape} ${styles.communityBack}`} />
      <div className={styles.projectIntro}>
        <div className={`${styles.shape} ${styles.projectVideo}`}>
          <div className={`${styles.shape} ${styles.projectAvatar}`} />
        </div>
        <div className={styles.projectCopy}>
          <div className={`${styles.shape} ${styles.projectTitle}`} />
          <div className={`${styles.shape} ${styles.communityLine}`} />
          <div className={`${styles.shape} ${styles.communityLine}`} />
          <div className={`${styles.shape} ${styles.communityShortLine}`} />
        </div>
      </div>
      <div className={`${styles.shape} ${styles.communityLine}`} />
      <div className={`${styles.shape} ${styles.communityLine}`} />
      <div className={`${styles.shape} ${styles.communityShortLine}`} />
    </div>
  ) : (
    <div className={styles.community}>
      <div className={styles.communityLayout}>
        <div className={styles.communitySidebar}>
          <div className={styles.communityProfile}>
            <div className={styles.communityIdentity}>
              <div className={`${styles.shape} ${styles.communityAvatar}`} />
              <div className={styles.communityIdentityCopy}>
                <div className={`${styles.shape} ${styles.communityName}`} />
                <div className={`${styles.shape} ${styles.communityHandle}`} />
              </div>
            </div>
            <div className={`${styles.shape} ${styles.communityLine}`} />
            <div className={`${styles.shape} ${styles.communityShortLine}`} />
            <div className={`${styles.shape} ${styles.communityChannel}`} />
          </div>
        </div>
        <div className={styles.communityFeed}>
          <div className={`${styles.shape} ${styles.communityHeading}`} />
          <div className={styles.communityTabs}>
            <div className={styles.shape} />
            <div className={styles.shape} />
            <div className={styles.shape} />
          </div>
          {["follow", "invite", "file"].map((kind) => (
            <div className={styles.communityNotification} key={kind}>
              <div className={`${styles.shape} ${styles.communityPostAvatar}`} />
              <div className={styles.communityNotificationCopy}>
                <div className={`${styles.shape} ${styles.communityLine}`} />
                <div className={`${styles.shape} ${styles.communityShortLine}`} />
              </div>
            </div>
          ))}
          <div className={styles.communityPost}>
            <div className={styles.communityNotification}>
              <div className={`${styles.shape} ${styles.communityPostAvatar}`} />
              <div className={styles.communityNotificationCopy}>
                <div className={`${styles.shape} ${styles.communityLine}`} />
                <div className={`${styles.shape} ${styles.communityShortLine}`} />
              </div>
            </div>
            <div className={`${styles.shape} ${styles.communityVideo}`} />
            <div className={styles.communityPostDescription}>
              <div className={`${styles.shape} ${styles.communityLine}`} />
              <div className={`${styles.shape} ${styles.communityLine}`} />
              <div className={`${styles.shape} ${styles.communityShortLine}`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EntranceSkeleton({
  mode,
  pathname,
  dashboardFeed,
}: { mode: "site" | "page"; pathname: string | null; dashboardFeed?: DCDashboardSkeletonProps }) {
  const market = pathname === "/market" || pathname?.startsWith("/market/");
  const marketItem = marketplaceItems.find((item) =>
    [`/market/${item.id}`, `/market/${item.id}/`].includes(pathname ?? ""),
  );
  const home = pathname === "/";
  const dashboard = ["/about", "/about/", "/community", "/community/"].includes(pathname ?? "");
  const community = pathname === "/community" || pathname?.startsWith("/community/");
  const skeletonPage = marketItem
    ? "item-market"
    : market
      ? "market"
      : home
        ? "home"
        : dashboard
          ? "dashboard"
          : community
            ? "community"
            : "generic";

  return (
    <div
      aria-busy="true"
      className={`${styles.overlay} ${mode === "page" ? styles.pageOverlay : ""}`}
      data-site-entrance="pending"
      data-skeleton-page={skeletonPage}
    >
      <output className="sr-only">
        {mode === "site" ? "Preparing the site." : "Preparing page."}
      </output>
      <div aria-hidden="true" className={styles.skeleton}>
        {mode === "site" && !home && (
          <div className={styles.header}>
            <div className={`${styles.shape} ${styles.navPill}`} data-slot="styled-skeleton" />
          </div>
        )}
        {marketItem ? (
          <div className={styles.itemMarket}>
            <div className={`${styles.shape} ${styles.itemMarketBack}`} />
            <div className={styles.itemMarketHero}>
              <div className={styles.itemMarketHeroHead}>
                <div className={`${styles.shape} ${styles.itemMarketTitle}`} />
                <div className={styles.itemMarketLegend}>
                  {["sold", "curve", "reserved"].map((key) => (
                    <div className={`${styles.shape} ${styles.itemMarketLegendItem}`} key={key} />
                  ))}
                </div>
              </div>
              <div className={styles.itemMarketFigureRow}>
                <div className={styles.itemMarketFigure}>
                  <div className={`${styles.shape} ${styles.itemMarketPrice}`} />
                  <div className={`${styles.shape} ${styles.itemMarketUnit}`} />
                </div>
                <div className={styles.itemMarketAside}>
                  <div className={`${styles.shape} ${styles.itemMarketDelta}`} />
                  <div className={`${styles.shape} ${styles.itemMarketCaption}`} />
                  <div className={`${styles.shape} ${styles.itemMarketChip}`} />
                </div>
              </div>
              <div className={styles.itemMarketStage}>
                <div
                  className={`${styles.shape} ${styles.itemMask} ${styles.itemMarketMask}`}
                  data-slot="styled-skeleton"
                  style={{
                    ...maskStyle(marketplaceSkeletonMasks[marketItem.id]),
                    ...getMarketplaceCoverStyle(marketItem.id),
                  }}
                />
              </div>
            </div>
            <div className={styles.itemMarketCopy}>
              <div className={`${styles.shape} ${styles.itemMarketStatus}`} />
              <div className={styles.itemMarketTrade}>
                <div className={styles.itemMarketRow}>
                  <div className={`${styles.shape} ${styles.itemMarketSegmented}`} />
                  <div className={`${styles.shape} ${styles.itemMarketChip}`} />
                </div>
                <div className={`${styles.shape} ${styles.itemMarketLabel}`} />
                <div className={`${styles.shape} ${styles.itemMarketInput}`} />
                {["out", "impact"].map((key) => (
                  <div className={styles.itemMarketRow} key={key}>
                    <div className={`${styles.shape} ${styles.itemMarketLabel}`} />
                    <div className={`${styles.shape} ${styles.itemMarketValue}`} />
                  </div>
                ))}
                <div className={`${styles.shape} ${styles.itemMarketNote}`} />
                <div className={`${styles.shape} ${styles.itemMarketSubmit}`} />
              </div>
            </div>
            <div className={styles.itemMarketTrenches}>
              <div className={styles.itemMarketRow}>
                <div className={`${styles.shape} ${styles.itemMarketHeading}`} />
                <div className={`${styles.shape} ${styles.itemMarketValue}`} />
              </div>
              <div className={styles.itemMarketRow}>
                <div className={`${styles.shape} ${styles.itemMarketCap}`} />
                <div className={`${styles.shape} ${styles.itemMarketChip}`} />
              </div>
              <div className={`${styles.shape} ${styles.itemMarketShare}`} />
              <div className={`${styles.shape} ${styles.itemMarketShareLabels}`} />
              {["first", "second", "third"].map((key) => (
                <div className={styles.itemMarketRow} key={key}>
                  <div className={`${styles.shape} ${styles.itemMarketName}`} />
                  <div className={`${styles.shape} ${styles.itemMarketSpark}`} />
                  <div className={`${styles.shape} ${styles.itemMarketValue}`} />
                </div>
              ))}
            </div>
          </div>
        ) : market ? (
          <div className={styles.market}>
            <div className={styles.marketProfile}>
              <div className={styles.marketProfileTop}>
                <div className={`${styles.shape} ${styles.marketProfileAvatar}`} />
                <div className={styles.marketProfileDeposit}>
                  <div className={styles.marketProfileDepositContent}>
                    <div className={styles.marketProfileDepositInfo}>
                      <div className={`${styles.shape} ${styles.marketProfileDepositLabel}`} />
                      <div className={styles.marketProfileDepositMetric}>
                        <div className={`${styles.shape} ${styles.marketProfileDepositValue}`} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.marketProfileExposition}>
                <div className={`${styles.shape} ${styles.marketProfileIcon}`} />
                <div className={styles.marketProfileExpositionCopy}>
                  <div className={`${styles.shape} ${styles.marketProfileExpositionTitle}`} />
                  <div className={`${styles.shape} ${styles.marketProfileDescription}`} />
                </div>
              </div>
              <div className={styles.marketHighlights}>
                {marketplaceItems.map((item) => (
                  <div className={`${styles.shape} ${styles.marketTradeCard}`} key={item.id} />
                ))}
              </div>
            </div>
            <div className={styles.marketFilterBar}>
              <div className={`${styles.shape} ${styles.marketFilter}`} />
            </div>
            <div className={styles.marketGrid}>
              {marketplaceItems.map((item) => (
                <div className={styles.marketCard} key={item.id}>
                  <div className={styles.card}>
                    <div className={`${styles.shape} ${styles.cardTitle}`} />
                    <div className={styles.marketMedia}>
                      <div
                        className={`${styles.shape} ${styles.itemMask}`}
                        data-slot="styled-skeleton"
                        style={{
                          ...maskStyle(marketplaceSkeletonMasks[item.id]),
                          ...getMarketplaceCoverStyle(item.id),
                        }}
                      />
                    </div>
                    <div className={styles.cardFooter}>
                      <div className={`${styles.shape} ${styles.marketBuy}`} />
                      <div className={styles.marketQuote}>
                        <div className={`${styles.shape} ${styles.cardBadge}`} />
                        <div className={`${styles.shape} ${styles.marketPrice}`} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : home ? (
          <div className={styles.hero}>
            <div className={styles.heroStack}>
              <div className={styles.heroArtwork}>
                <div
                  className={`${styles.shape} ${styles.heroMask}`}
                  data-slot="styled-skeleton"
                  style={maskStyle(marketplaceSkeletonMasks["bulletproof-umbrella"])}
                />
              </div>
              <div className={styles.heroCopy}>
                <div className={`${styles.shape} ${styles.heroTitle}`} />
                <div className={styles.heroLines}>
                  <div className={`${styles.shape} ${styles.heroLine}`} />
                  <div className={`${styles.shape} ${styles.heroLine}`} />
                  <div className={`${styles.shape} ${styles.heroLastLine}`} />
                </div>
                <div className={styles.heroActions}>
                  <div className={`${styles.shape} ${styles.heroConnect}`} />
                  <div className={`${styles.shape} ${styles.heroGuest}`} />
                </div>
              </div>
            </div>
          </div>
        ) : dashboard ? (
          <div className={styles.dashboard}>
            <DCDashboardSkeleton {...dashboardFeed} />
          </div>
        ) : community ? (
          <CommunitySkeleton article />
        ) : (
          <div className={styles.content}>
            <div className={`${styles.shape} ${styles.contentTitle}`} />
            <div className={styles.contentPanel}>
              <div className={`${styles.shape} ${styles.contentAvatar}`} />
              <div className={`${styles.shape} ${styles.contentLine}`} />
              <div className={`${styles.shape} ${styles.contentLine}`} />
              <div className={`${styles.shape} ${styles.contentShortLine}`} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function isVisibleResource(element: Element, root: HTMLElement): boolean {
  const bounds = element.getBoundingClientRect();
  if (
    bounds.width <= 0 ||
    bounds.height <= 0 ||
    bounds.bottom <= 0 ||
    bounds.right <= 0 ||
    bounds.top >= window.innerHeight ||
    bounds.left >= window.innerWidth
  ) {
    return false;
  }

  // The root is deliberately inert and transparent while its resources prepare.
  for (let node: Element | null = element; node && node !== root; node = node.parentElement) {
    if (node.hasAttribute("inert") || node.hasAttribute("hidden")) return false;
    const style = window.getComputedStyle(node);
    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      style.visibility === "collapse"
    ) {
      return false;
    }
  }
  return true;
}

/** Conceal the initial document or only the entering page until its visible media is ready. */
export function DCSiteEntrance({
  afterReady,
  children,
  dashboardFeed,
  mode = "site",
  onReady,
}: DCSiteEntranceProps) {
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<EntranceStatus>("pending");
  const [phase, setPhase] = useState<DCLoadingPhase>("brand");
  const skeletonMinimum = useRef<number | null>(null);
  const ready = status !== "pending";
  const loadingPhase = ready ? "ready" : phase;
  const brandDuration = mode === "site" ? 1500 : 200;
  // On page changes the persistent umbrella is the loader, so the logo is not shown.
  const [umbrellaCovers] = useState(
    () =>
      mode === "page" &&
      typeof document !== "undefined" &&
      document.documentElement.dataset.umbrellaStage === "ready",
  );

  useLayoutEffect(() => {
    // The logo and the minimum skeleton (1500 + at least 1000 ms) are the download window.
    if (mode === "site") runEntrancePreload(window.location.pathname, brandDuration + 1000);
  }, [brandDuration, mode]);

  useLayoutEffect(() => {
    if (phase !== "brand") return;
    const timer = window.setTimeout(() => setPhase("skeleton"), brandDuration);
    return () => window.clearTimeout(timer);
  }, [brandDuration, phase]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || ready || phase === "brand") return;

    const startedAt = performance.now();
    // Sample only on the client, once per entrance, including cached route visits.
    skeletonMinimum.current ??= mode === "site" ? 1000 + Math.floor(Math.random() * 1501) : 180;
    const minimumDuration = skeletonMinimum.current;
    let stopped = false;
    let frame = 0;
    let fontsReady = !document.fonts || document.fonts.status !== "loading";
    let minimumTimer = 0;
    let maximumTimer = 0;
    let pollTimer = 0;
    const failedFontLinks = new WeakSet<HTMLLinkElement>();

    const stop = () => {
      stopped = true;
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.clearTimeout(minimumTimer);
      window.clearTimeout(maximumTimer);
      window.clearInterval(pollTimer);
      document.removeEventListener("load", onResourceSettled, true);
      document.removeEventListener("error", onResourceSettled, true);
      window.removeEventListener("resize", scheduleCheck);
      window.removeEventListener("scroll", scheduleCheck);
    };

    const finish = (result: Exclude<EntranceStatus, "pending">) => {
      if (stopped) return;
      stop();
      setStatus(result);
      onReady?.();
    };

    const check = () => {
      frame = 0;
      if (stopped || !fontsReady || performance.now() - startedAt < minimumDuration) return;
      const fontLink =
        pathname === "/" ? document.querySelector<HTMLLinkElement>("link[data-home-font]") : null;
      if (
        fontLink &&
        !fontLink.sheet &&
        !failedFontLinks.has(fontLink) &&
        fontLink.dataset.homeFontFailed !== "true"
      )
        return;
      if (document.fonts?.status === "loading") return;
      const pending = Array.from(root.querySelectorAll('[data-site-loading="true"]')).some(
        (element) => isVisibleResource(element, root),
      );
      if (!pending) finish("ready");
    };

    function scheduleCheck() {
      if (!stopped && !frame) frame = requestAnimationFrame(check);
    }

    function onResourceSettled(event: Event) {
      const target = event.target;
      if (target instanceof HTMLLinkElement && target.hasAttribute("data-home-font")) {
        if (event.type === "error") {
          failedFontLinks.add(target);
          target.dataset.homeFontFailed = "true";
        }
        scheduleCheck();
      } else if (target instanceof Node && root?.contains(target)) {
        scheduleCheck();
      }
    }

    const observer = new MutationObserver(scheduleCheck);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-site-loading", "hidden", "inert", "class"],
      childList: true,
      subtree: true,
    });
    document.addEventListener("load", onResourceSettled, true);
    document.addEventListener("error", onResourceSettled, true);
    window.addEventListener("resize", scheduleCheck);
    window.addEventListener("scroll", scheduleCheck, { passive: true });
    minimumTimer = window.setTimeout(scheduleCheck, minimumDuration);
    // A stalled remote asset must not lock the app behind the entrance indefinitely.
    maximumTimer = window.setTimeout(() => finish("timeout"), 12000);
    pollTimer = window.setInterval(scheduleCheck, 100);

    void document.fonts?.ready.then(
      () => {
        fontsReady = true;
        scheduleCheck();
      },
      () => {
        fontsReady = true;
        scheduleCheck();
      },
    );
    if (mode === "page" && fontsReady) check();
    else scheduleCheck();

    return stop;
  }, [mode, onReady, pathname, phase, ready]);

  useEffect(() => {
    if (status === "pending") return;
    const event = mode === "site" ? "dc:site-ready" : "dc:page-ready";
    window.dispatchEvent(new CustomEvent(event, { detail: { reason: status } }));
  }, [mode, status]);

  return (
    <DCLoadingContext.Provider value={loadingPhase}>
      <div
        aria-hidden={ready ? undefined : true}
        className={mode === "site" ? styles.site : styles.page}
        data-app-ready={mode === "site" ? String(ready) : undefined}
        data-page-ready={mode === "page" ? String(ready) : undefined}
        data-loading-phase={loadingPhase}
        inert={ready ? undefined : true}
        ref={rootRef}
        style={ready ? undefined : { opacity: 0 }}
      >
        {children}
        {ready && afterReady}
      </div>
      {!ready && <EntranceSkeleton mode={mode} pathname={pathname} dashboardFeed={dashboardFeed} />}
      {loadingPhase === "brand" && !umbrellaCovers && (
        <DCBrandPreloader durationMs={brandDuration} />
      )}
    </DCLoadingContext.Provider>
  );
}
